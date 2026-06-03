import { type CSSProperties, type ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { LoginScreen } from './LoginScreen'
import {
  COLOR_BG_BASE,
  COLOR_BG_OVERLAY,
  COLOR_BORDER,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
} from '../tokens'

const SS: CSSProperties = { fontFamily: '"DM Sans","Segoe UI",system-ui,sans-serif' }

/**
 * Full auth gate. Sits inside AuthProvider, around App.
 *
 *   loading    -> minimal centered loader (no flash of login on refresh)
 *   no session -> <LoginScreen />
 *   session    -> the app, plus an unobtrusive sign-out control
 *
 * App.tsx is intentionally not touched; the sign-out control is rendered
 * as a sibling overlay rather than wired into App's internal header.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  // State 1: session is being restored — render neither login nor app.
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: COLOR_BG_BASE,
          color: COLOR_TEXT_SECONDARY,
          fontSize: 13,
          ...SS,
        }}
      >
        Loading…
      </div>
    )
  }

  // State 2: no session — show the login/signup screen instead of the app.
  if (!session) {
    return <LoginScreen />
  }

  // State 3: authenticated — render the app, with sign-out alongside it.
  return (
    <>
      {children}
      <SignOutControl />
    </>
  )
}

// Fixed bottom-right control. Top-right is avoided because App's canvas
// already places an error-banner close button and a copy button there.
function SignOutControl() {
  const { user, signOut } = useAuth()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: COLOR_BG_OVERLAY,
        border: `1px solid ${COLOR_BORDER}`,
        borderRadius: 99,
        padding: '5px 5px 5px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,.4)',
        ...SS,
      }}
    >
      {user?.email && (
        <span
          style={{
            fontSize: 11,
            color: COLOR_TEXT_SECONDARY,
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user.email}
        </span>
      )}
      <button
        type="button"
        onClick={() => signOut()}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: COLOR_TEXT_PRIMARY,
          background: COLOR_BG_BASE,
          border: `1px solid ${COLOR_BORDER}`,
          borderRadius: 99,
          padding: '5px 12px',
          cursor: 'pointer',
          ...SS,
        }}
      >
        Sign out
      </button>
    </div>
  )
}
