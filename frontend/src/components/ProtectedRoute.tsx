import { type CSSProperties } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ROUTES } from '../routes'
import { COLOR_BG_BASE, COLOR_TEXT_SECONDARY } from '../tokens'

const SS: CSSProperties = { fontFamily: '"DM Sans","Segoe UI",system-ui,sans-serif' }

function LoadingScreen() {
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

/**
 * Hard gate for authenticated routes.
 * Checks loading FIRST — renders spinner while session is being restored
 * on hard refresh. Never redirects before auth state is known.
 */
export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  return <Outlet />
}

/**
 * Guard for public-only routes (marketing pages, login).
 *
 * Optimistic render: logged-in users briefly see marketing page before
 * redirect. Intentional for prerender/hydration stability (SEO phase).
 * No loading gate here — avoids flicker on public pages.
 */
export function PublicOnlyRoute() {
  const { session } = useAuth()

  if (session) return <Navigate to={ROUTES.app} replace />
  return <Outlet />
}
