import { Link, NavLink } from 'react-router-dom'
import { ROUTES } from '../routes'

export function SiteHeader() {
  return (
    <header>
      {/* Skip link — visible on focus only (sr-only pattern via Tailwind) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-white focus:text-black"
      >
        Skip to main content
      </a>
      <nav aria-label="Primary">
        <Link to={ROUTES.home}>Archon</Link>
        <NavLink to={ROUTES.pricing}>Pricing</NavLink>
        <NavLink to={ROUTES.about}>About</NavLink>
        <NavLink to={ROUTES.login}>Sign in</NavLink>
      </nav>
    </header>
  )
}
