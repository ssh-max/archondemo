import { type CSSProperties } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ROUTES } from '../routes'
import {
  COLOR_BG_BASE,
  COLOR_BG_OVERLAY,
  COLOR_BORDER,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
} from '../tokens'

const SS: CSSProperties = { fontFamily: '"DM Sans","Segoe UI",system-ui,sans-serif' }

// Fixed bottom-right control. Top-right is avoided because App's canvas
// already places an error-banner close button and a copy button there.
function SignOutControl() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate(ROUTES.home, { replace: true })
  }

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
        onClick={handleSignOut}
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

export function ProtectedLayout() {
  return (
    <>
      <SignOutControl />
      <main>
        <Outlet />
      </main>
    </>
  )
}
