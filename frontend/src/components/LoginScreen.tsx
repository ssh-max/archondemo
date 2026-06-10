import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ROUTES } from '../routes'
import './LoginScreen.css'

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

  return (
    <div className="arc-login">
      <div className="arc-login-card">
        {/* Brand */}
        <div className="arc-login-brand">
          <div className="arc-login-mark">A</div>
          <span className="arc-login-wordmark">Archon</span>
        </div>
        <p className="arc-login-tagline">Enterprise architecture advisor</p>

        {/* Mode toggle */}
        <div className="arc-login-toggle">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`arc-login-toggle-btn${mode === m ? ' is-active' : ''}`}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" className="arc-login-banner arc-login-banner-error">
            {error}
          </div>
        )}

        {/* Info banner (e.g. confirm-your-email) */}
        {info && <div className="arc-login-banner arc-login-banner-info">{info}</div>}

        <form onSubmit={handleSubmit}>
          <div className="arc-login-field">
            <label htmlFor="auth-email" className="arc-login-label">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="arc-login-input"
            />
          </div>
          <div className="arc-login-field arc-login-field-last">
            <label htmlFor="auth-password" className="arc-login-label">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="arc-login-input"
            />
          </div>

          <button type="submit" disabled={submitting} className="arc-login-submit">
            {submitting
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="arc-login-divider">
          <div className="arc-login-divider-rule" />
          <span className="arc-login-divider-text">or</span>
          <div className="arc-login-divider-rule" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="arc-login-google"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
