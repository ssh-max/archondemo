import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import './Landing.css'

/* ──────────────────────────────────────────────────────────────────────────
   Archon — Landing page (renders inside PublicLayout, which already provides
   SiteHeader + SiteFooter; no header/footer here).

   All styling lives in the co-located Landing.css, scoped under `.arc-landing`
   with `arc-*` namespaced classes so nothing leaks into the app or other pages.
   The product mockup is pure CSS + inline SVG — no external image URLs.
   ────────────────────────────────────────────────────────────────────────── */

/* Reusable inline SVG glyph for the feature cards (amber on navy tile). */
function FeatureIcon({ path }: { path: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* The CSS/SVG product mockup: a browser window framing a simplified
   architecture diagram + a low/mid/high cost strip. Reused (compact) in Proof. */
function ProductMockup({ url = 'archon.app/solution' }: { url?: string }) {
  return (
    <div className="arc-mockup">
      <div className="arc-mockup-bar">
        <span className="arc-dot" />
        <span className="arc-dot" />
        <span className="arc-dot arc-dot-amber" />
        <span className="arc-mockup-url">{url}</span>
      </div>
      <div className="arc-mockup-body">
        {/* Simplified architecture diagram — inline SVG, palette nodes/edges. */}
        <svg
          className="arc-mockup-diagram"
          viewBox="0 0 460 230"
          role="img"
          aria-label="Simplified cloud architecture diagram"
        >
          {/* edges */}
          <g stroke="#5B6B8C" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M130 55 H210" />
            <path d="M170 80 V150" />
            <path d="M250 67 H310" />
            <path d="M250 175 H310" />
            <path d="M350 90 V150" />
          </g>
          {/* node: client */}
          <g>
            <rect x="40" y="38" width="90" height="36" rx="9" fill="#CADCFC" />
            <text x="85" y="61" textAnchor="middle" fontSize="13" fill="#16203F" fontFamily="DM Sans, sans-serif">Client</text>
          </g>
          {/* node: gateway */}
          <g>
            <rect x="170" y="48" width="92" height="38" rx="9" fill="#16203F" />
            <text x="216" y="72" textAnchor="middle" fontSize="13" fill="#FFFFFF" fontFamily="DM Sans, sans-serif">Gateway</text>
          </g>
          {/* node: compute (amber accent) */}
          <g>
            <rect x="124" y="150" width="96" height="40" rx="9" fill="#F5A623" />
            <text x="172" y="175" textAnchor="middle" fontSize="13" fill="#16203F" fontFamily="DM Sans, sans-serif" fontWeight="600">Compute</text>
          </g>
          {/* node: storage */}
          <g>
            <rect x="310" y="48" width="96" height="38" rx="9" fill="#FFFFFF" stroke="#CADCFC" strokeWidth="1.6" />
            <text x="358" y="72" textAnchor="middle" fontSize="13" fill="#16203F" fontFamily="DM Sans, sans-serif">Storage</text>
          </g>
          {/* node: database */}
          <g>
            <rect x="310" y="156" width="96" height="38" rx="9" fill="#FFFFFF" stroke="#CADCFC" strokeWidth="1.6" />
            <text x="358" y="180" textAnchor="middle" fontSize="13" fill="#16203F" fontFamily="DM Sans, sans-serif">Database</text>
          </g>
        </svg>

        {/* Cost-range strip: low / mid / high */}
        <div className="arc-cost">
          <div className="arc-cost-head">
            <span className="arc-cost-title">Estimated monthly cost</span>
            <span className="arc-cost-note">Azure-native · est.</span>
          </div>
          <div className="arc-cost-chips">
            <div className="arc-cost-chip">
              <span className="arc-cost-label">Low</span>
              <span className="arc-cost-value">$1.2k</span>
            </div>
            <div className="arc-cost-chip arc-chip-mid">
              <span className="arc-cost-label">Mid</span>
              <span className="arc-cost-value">$2.4k</span>
            </div>
            <div className="arc-cost-chip">
              <span className="arc-cost-label">High</span>
              <span className="arc-cost-value">$3.9k</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const STEPS = [
  {
    n: '1',
    title: 'Describe the need',
    text: 'Plain English or a guided form — share the client brief, constraints, and goals.',
  },
  {
    n: '2',
    title: 'Claude reasons & designs',
    text: 'Trade-offs, compliance, and alternatives weighed into a grounded solution.',
  },
  {
    n: '3',
    title: 'Review, refine, share',
    text: 'Edit, regenerate, then export or hand the finished solution to the client.',
  },
]

const FEATURES = [
  {
    title: 'Solution overview',
    text: 'A clear narrative of the proposed approach and why it fits the brief.',
    icon: 'M4 6h16M4 12h16M4 18h10',
  },
  {
    title: 'Architecture diagram',
    text: 'A rendered cloud architecture you can read, refine, and present.',
    icon: 'M5 5h5v5H5zM14 14h5v5h-5zM10 7h4M7 10v4M17 10v4',
  },
  {
    title: 'Security posture',
    text: 'Identity, network, and data protections called out against best practice.',
    icon: 'M12 3l7 3v6c0 4-3 6.5-7 9-4-2.5-7-5-7-9V6z',
  },
  {
    title: 'Costed estimate',
    text: 'A low / mid / high cost range so budget conversations start grounded.',
    icon: 'M12 3v18M8 7h6a3 3 0 010 6H8m0 0h7',
  },
  {
    title: 'IaC starter',
    text: 'Infrastructure-as-code scaffolding to move from design to deployment.',
    icon: 'M8 9l-4 3 4 3M16 9l4 3-4 3M13 6l-2 12',
  },
  {
    title: 'Delivery roadmap',
    text: 'A phased plan that turns the architecture into a sequenced engagement.',
    icon: 'M4 18h16M6 18V9M11 18V5M16 18v-6M21 18v-3',
  },
]

export function Landing() {
  return (
    <div className="arc-landing">
      {/* ── 1. HERO ───────────────────────────────────────────────────── */}
      <section className="arc-hero">
        <div className="arc-container arc-hero-grid">
          <div className="arc-hero-copy">
            <h1 className="arc-hero-headline">
              Turn a client brief into a{' '}
              <span className="arc-accent">costed cloud architecture</span> — instantly.
            </h1>
            <p className="arc-hero-sub">
              Walk into every client meeting with a costed solution already in hand —
              powered by Claude, grounded in cloud best practice.
            </p>
            <div className="arc-cta-row">
              <Link className="arc-btn arc-btn-primary" to={ROUTES.login}>
                Get started
              </Link>
              <Link className="arc-btn arc-btn-secondary" to={ROUTES.pricing}>
                See pricing
              </Link>
            </div>
            <div className="arc-pill-row">
              <span className="arc-pill">AI-powered, built on Claude</span>
              <span className="arc-pill">Azure-native</span>
              <span className="arc-pill">Architecture · security · cost · IaC</span>
            </div>
          </div>
          <div className="arc-hero-media">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* ── 2. HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="arc-section">
        <div className="arc-container">
          <p className="arc-eyebrow">How it works</p>
          <h2 className="arc-section-title">From brief to solution in three steps</h2>
          <p className="arc-section-sub">
            Archon does the heavy lifting between the client brief and a presentable,
            costed architecture.
          </p>
          <div className="arc-steps">
            {STEPS.map((s) => (
              <div className="arc-step" key={s.n}>
                <span className="arc-step-num">{s.n}</span>
                <h3 className="arc-step-title">{s.title}</h3>
                <p className="arc-step-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. WHAT EVERY SOLUTION INCLUDES ───────────────────────────── */}
      <section className="arc-section" style={{ background: '#EDF1FA' }}>
        <div className="arc-container">
          <p className="arc-eyebrow">What you get</p>
          <h2 className="arc-section-title">What every solution includes</h2>
          <p className="arc-section-sub">
            Each generated solution arrives complete — ready to review, refine, and present.
          </p>
          <div className="arc-features">
            {FEATURES.map((f) => (
              <div className="arc-feature" key={f.title}>
                <span className="arc-feature-icon">
                  <FeatureIcon path={f.icon} />
                </span>
                <h3 className="arc-feature-title">{f.title}</h3>
                <p className="arc-feature-text">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PRICING TEASER ─────────────────────────────────────────── */}
      <section className="arc-section">
        <div className="arc-container">
          <p className="arc-eyebrow">Pricing</p>
          <h2 className="arc-section-title">Start free, upgrade when you scale</h2>
          <p className="arc-section-sub">
            A quick look at the plans — see the full breakdown on the pricing page.
          </p>
          <div className="arc-pricing">
            {/* Free plan */}
            <div className="arc-plan">
              <h3 className="arc-plan-name">Free</h3>
              {/* Placeholder price — real pricing lives on the Pricing page. */}
              <p className="arc-plan-price">
                $—<span>/mo</span>
              </p>
              <ul className="arc-plan-list">
                <li>Generate costed architectures</li>
                <li>Architecture diagram &amp; cost range</li>
                <li>Export your solution</li>
              </ul>
            </div>
            {/* Pro plan */}
            <div className="arc-plan arc-plan-pro">
              <span className="arc-plan-badge">Popular</span>
              <h3 className="arc-plan-name">Pro</h3>
              {/* Placeholder price — real pricing lives on the Pricing page. */}
              <p className="arc-plan-price">
                $—<span>/mo</span>
              </p>
              <ul className="arc-plan-list">
                <li>Everything in Free</li>
                <li>Security posture &amp; IaC starter</li>
                <li>Delivery roadmap &amp; priority generation</li>
              </ul>
            </div>
          </div>
          <div className="arc-pricing-foot">
            <Link className="arc-btn arc-btn-ghost" to={ROUTES.pricing}>
              See full pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. PROOF — "See it in action" ─────────────────────────────── */}
      <section className="arc-section">
        <div className="arc-container">
          <div className="arc-proof">
            <p className="arc-eyebrow">See it in action</p>
            <h2 className="arc-section-title">A look at the output</h2>
            <p className="arc-section-sub">
              Every solution pairs a clear architecture diagram with a grounded cost estimate.
            </p>
            <div className="arc-proof-grid">
              {/* PLACEHOLDER: stand-ins for real product screenshots (not yet
                  available). Left reuses the live CSS/SVG mockup; right is a
                  framed placeholder. Swap both for real screenshots later. */}
              <div className="arc-frame">
                <ProductMockup url="archon.app/diagram" />
                <p className="arc-frame-caption">Architecture diagram</p>
              </div>
              <div className="arc-frame">
                <ProductMockup url="archon.app/estimate" />
                <p className="arc-frame-caption">Costed estimate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FINAL CTA ──────────────────────────────────────────────── */}
      <section className="arc-final">
        <div className="arc-container">
          <h2 className="arc-final-title">
            Walk into your next client meeting with the solution already in hand.
          </h2>
          <Link className="arc-btn arc-btn-primary" to={ROUTES.login}>
            Get started
          </Link>
        </div>
      </section>
    </div>
  )
}
