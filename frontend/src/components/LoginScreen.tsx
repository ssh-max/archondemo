import { useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ROUTES } from '../routes'
import {
  COLOR_BG_BASE,
  COLOR_BG_SURFACE,
  COLOR_BG_OVERLAY,
  COLOR_BORDER,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_TEXT_MUTED,
  COLOR_INFO_BG,
  COLOR_INFO_TEXT,
} from '../tokens'

// Font stacks mirror App.tsx so the gate feels native to the app.
const SS: CSSProperties = { fontFamily: '"DM Sans","Segoe UI",system-ui,sans-serif' }
const LORA: CSSProperties = { fontFamily: '"Lora",Georgia,serif' }

const AMBER = '#f59e0b'
const AMBER_HOVER = '#fbbf24'

type Mode = 'signin' | 'signup'

export function LoginScreen() {
  const { signInWithPassword, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setInfo('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword(email, password)
        if (error) {
          setError(error.message)
          return
        }
        navigate(
          (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? ROUTES.app,
          { replace: true },
        )
      } else {
        const { data, error } = await signUp(email, password)
        if (error) {
          setError(error.message)
          return
        }
        // Supabase returns a user but a null session when email confirmation
        // is required. Tell the user instead of appearing to do nothing.
        if (data.user && !data.session) {
          setInfo('Check your email to confirm your account, then sign in.')
        } else if (data.session) {
          navigate(ROUTES.app, { replace: true })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setInfo('')
    setSubmitting(true)
    try {
      // OAuth may be unconfigured in this environment — never let it crash the
      // screen. Surface any error (returned or thrown) in the banner.
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in is unavailable right now.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    fontSize: 13,
    color: COLOR_TEXT_PRIMARY,
    background: COLOR_BG_OVERLAY,
    border: `1px solid ${COLOR_BORDER}`,
    borderRadius: 8,
    outline: 'none',
    ...SS,
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.2,
    color: COLOR_TEXT_SECONDARY,
    marginBottom: 6,
    ...SS,
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLOR_BG_BASE,
        padding: 24,
        boxSizing: 'border-box',
        ...SS,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: COLOR_BG_SURFACE,
          border: `1px solid ${COLOR_BORDER}`,
          borderRadius: 14,
          padding: 32,
          boxShadow: '0 12px 40px rgba(0,0,0,.45)',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: AMBER,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: COLOR_BG_BASE,
              fontSize: 18,
              ...LORA,
            }}
          >
            A
          </div>
          <span style={{ fontSize: 22, fontWeight: 600, color: COLOR_TEXT_PRIMARY, ...LORA }}>
            Archon
          </span>
        </div>
        <p style={{ fontSize: 12, color: COLOR_TEXT_MUTED, margin: '0 0 24px' }}>
          Enterprise architecture advisor
        </p>

        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            background: COLOR_BG_OVERLAY,
            border: `1px solid ${COLOR_BORDER}`,
            borderRadius: 8,
            padding: 3,
            marginBottom: 20,
          }}
        >
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '7px 0',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                borderRadius: 6,
                background: mode === m ? AMBER : 'transparent',
                color: mode === m ? COLOR_BG_BASE : COLOR_TEXT_SECONDARY,
                transition: 'background .15s,color .15s',
                ...SS,
              }}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            style={{
              background: '#3a1212',
              border: '1px solid #7f1d1d',
              color: '#fca5a5',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 12,
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Info banner (e.g. confirm-your-email) */}
        {info && (
          <div
            style={{
              background: COLOR_INFO_BG,
              border: '1px solid #1f4480',
              color: COLOR_INFO_TEXT,
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 12,
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="auth-email" style={labelStyle}>
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="auth-password" style={labelStyle}>
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '11px 0',
              fontSize: 13,
              fontWeight: 700,
              cursor: submitting ? 'default' : 'pointer',
              border: 'none',
              borderRadius: 8,
              background: submitting ? '#7a5206' : AMBER,
              color: COLOR_BG_BASE,
              opacity: submitting ? 0.7 : 1,
              transition: 'background .15s',
              ...SS,
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = AMBER_HOVER
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.background = AMBER
            }}
          >
            {submitting
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: COLOR_BORDER }} />
          <span style={{ fontSize: 11, color: COLOR_TEXT_MUTED }}>or</span>
          <div style={{ flex: 1, height: 1, background: COLOR_BORDER }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          style={{
            width: '100%',
            padding: '10px 0',
            fontSize: 13,
            fontWeight: 600,
            cursor: submitting ? 'default' : 'pointer',
            border: `1px solid ${COLOR_BORDER}`,
            borderRadius: 8,
            background: COLOR_BG_OVERLAY,
            color: COLOR_TEXT_PRIMARY,
            opacity: submitting ? 0.7 : 1,
            ...SS,
          }}
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
