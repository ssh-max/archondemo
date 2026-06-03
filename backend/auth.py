"""
JWT authentication for the Archon backend.

Verifies Supabase-issued JWTs using asymmetric public keys fetched from the
project's JWKS endpoint. Supports both RSA (RS256/384/512) and EC (ES256/384)
key types — the correct path is chosen per-key from the 'kty' field in the JWK.

Config is read lazily: importing this module does not touch any env vars.
The RuntimeError for a missing var is only raised the first time a protected
route is actually hit, so the app boots cleanly without auth env vars set.

The service key (database.py) is entirely separate from JWT verification.
"""

import logging
import os
from dataclasses import dataclass
from typing import Any

import httpx
import jwt
from fastapi import Depends, Header, HTTPException
from jwt.algorithms import ECAlgorithm, RSAAlgorithm

logger = logging.getLogger(__name__)

# Allowed asymmetric algorithms — rejects 'none' and all HS-family to prevent
# algorithm confusion attacks even if a caller crafts a malicious header.
_ALLOWED_ALGORITHMS = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"]

# Module-level JWKS cache: kid → public key object (RSA or EC).
# Populated on first use and refreshed on cache miss (key rotation).
_jwks_cache: dict[str, Any] = {}


# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class _AuthConfig:
    jwks_url: str
    issuer: str
    audience: str


_config: _AuthConfig | None = None


def _get_auth_config() -> _AuthConfig:
    global _config
    if _config is not None:
        return _config

    jwks_url = os.environ.get("SUPABASE_JWKS_URL", "")
    issuer   = os.environ.get("SUPABASE_JWT_ISSUER", "")
    audience = os.environ.get("SUPABASE_JWT_AUDIENCE", "authenticated")

    if not jwks_url:
        raise RuntimeError(
            "SUPABASE_JWKS_URL environment variable is not set — required for "
            "JWT verification."
        )
    if not issuer:
        raise RuntimeError(
            "SUPABASE_JWT_ISSUER environment variable is not set — required for "
            "JWT verification."
        )

    _config = _AuthConfig(jwks_url=jwks_url, issuer=issuer, audience=audience)
    return _config


# ─────────────────────────────────────────────────────────────────────────────
# JWKS CACHE
# ─────────────────────────────────────────────────────────────────────────────

def _fetch_jwks() -> None:
    """
    Fetch the JWKS endpoint and populate _jwks_cache with kid → public key.

    Branches on each key's 'kty' field:
      - 'RSA' → RSAAlgorithm.from_jwk  (RS256 / RS384 / RS512)
      - 'EC'  → ECAlgorithm.from_jwk   (ES256 / ES384 / ES512)

    Both paths are wired: Supabase projects may use either key type, and the
    correct constructor is chosen per-key so this function works regardless of
    which your project uses. Keys with an unrecognised kty are skipped with a
    warning rather than crashing, to allow forwards-compatible key rotation.
    """
    config = _get_auth_config()
    try:
        resp = httpx.get(config.jwks_url, timeout=10)
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise RuntimeError(f"Failed to fetch JWKS from {config.jwks_url}: {exc}") from exc

    keys = resp.json().get("keys", [])
    if not keys:
        raise RuntimeError(f"JWKS response from {config.jwks_url} contained no keys")

    loaded = 0
    for jwk in keys:
        kid = jwk.get("kid")
        kty = jwk.get("kty", "").upper()
        if not kid:
            logger.warning("JWKS key missing 'kid' field — skipping: %s", jwk.get("use"))
            continue

        try:
            if kty == "RSA":
                _jwks_cache[kid] = RSAAlgorithm.from_jwk(jwk)
                loaded += 1
            elif kty == "EC":
                _jwks_cache[kid] = ECAlgorithm.from_jwk(jwk)
                loaded += 1
            else:
                logger.warning(
                    "JWKS key kid=%r has unrecognised kty=%r — skipping", kid, kty
                )
        except Exception as exc:
            logger.warning("Failed to load JWKS key kid=%r kty=%r: %s", kid, kty, exc)

    if loaded == 0:
        raise RuntimeError("JWKS fetch succeeded but no usable keys were loaded")

    logger.info("JWKS cache refreshed: %d key(s) loaded", loaded)


def _get_key(kid: str) -> Any:
    """Return the cached public key for kid, refreshing once on a cache miss."""
    if kid not in _jwks_cache:
        _fetch_jwks()
    if kid not in _jwks_cache:
        raise HTTPException(
            401, f"JWT key id '{kid}' not found in JWKS — token may be stale"
        )
    return _jwks_cache[kid]


# ─────────────────────────────────────────────────────────────────────────────
# TOKEN VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

def verify_token(token: str) -> dict:
    """
    Verify a Supabase JWT and return its decoded claims.

    Steps:
      1. Decode the header (no signature check) to extract kid and alg.
      2. Reject any algorithm outside _ALLOWED_ALGORITHMS (blocks alg confusion).
      3. Fetch the matching public key from the JWKS cache.
      4. Fully verify: signature, exp, nbf, iss, aud in one PyJWT call.

    On issuer or audience mismatch, logs a WARNING with the actual iss/aud
    values found in the token versus the configured expectations — without
    logging the token itself, the signature, or any secret. This makes the
    first login failure diagnosable at a glance from the server log.

    Raises HTTPException(401) on any verification failure.
    """
    config = _get_auth_config()

    # Decode header without verification to get kid + alg.
    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError as exc:
        raise HTTPException(401, f"Invalid JWT header: {exc}") from exc

    alg = header.get("alg", "")
    kid = header.get("kid", "")

    if alg not in _ALLOWED_ALGORITHMS:
        raise HTTPException(
            401,
            f"JWT algorithm '{alg}' is not permitted — must be one of "
            f"{_ALLOWED_ALGORITHMS}",
        )

    public_key = _get_key(kid)

    try:
        claims = jwt.decode(
            token,
            public_key,
            algorithms=_ALLOWED_ALGORITHMS,
            audience=config.audience,
            issuer=config.issuer,
        )
        return claims

    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(401, "JWT has expired") from exc

    except jwt.InvalidIssuerError as exc:
        # Extract the actual iss from the unverified payload for diagnostics.
        # We read claims without verification solely to surface the iss/aud
        # values — the token itself, its signature, and all secrets stay out
        # of the log.
        try:
            unverified = jwt.decode(
                token, options={"verify_signature": False}, algorithms=_ALLOWED_ALGORITHMS
            )
            actual_iss = unverified.get("iss", "<missing>")
            actual_aud = unverified.get("aud", "<missing>")
        except Exception:
            actual_iss = actual_aud = "<could not decode>"

        logger.warning(
            "JWT issuer mismatch — expected iss=%r aud=%r, "
            "token contained iss=%r aud=%r",
            config.issuer,
            config.audience,
            actual_iss,
            actual_aud,
        )
        raise HTTPException(
            401,
            f"JWT issuer mismatch — check SUPABASE_JWT_ISSUER (see server log)",
        ) from exc

    except jwt.InvalidAudienceError as exc:
        try:
            unverified = jwt.decode(
                token, options={"verify_signature": False}, algorithms=_ALLOWED_ALGORITHMS
            )
            actual_iss = unverified.get("iss", "<missing>")
            actual_aud = unverified.get("aud", "<missing>")
        except Exception:
            actual_iss = actual_aud = "<could not decode>"

        logger.warning(
            "JWT audience mismatch — expected iss=%r aud=%r, "
            "token contained iss=%r aud=%r",
            config.issuer,
            config.audience,
            actual_iss,
            actual_aud,
        )
        raise HTTPException(
            401,
            "JWT audience mismatch — check SUPABASE_JWT_AUDIENCE (see server log)",
        ) from exc

    except jwt.InvalidTokenError as exc:
        raise HTTPException(401, f"Invalid JWT: {exc}") from exc


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI DEPENDENCY
# ─────────────────────────────────────────────────────────────────────────────

def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """
    FastAPI dependency that extracts and verifies the Bearer token from the
    Authorization header, returning {"user_id": <sub claim>}.

    Raises HTTPException(401) for any missing, malformed, or invalid token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            401,
            "Missing or malformed Authorization header — expected 'Bearer <token>'",
        )

    token = authorization[len("Bearer "):]
    claims = verify_token(token)

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(401, "JWT is missing the 'sub' claim")

    return {"user_id": user_id}
