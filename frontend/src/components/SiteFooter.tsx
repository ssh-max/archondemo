import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'

export function SiteFooter() {
  return (
    <footer>
      <nav aria-label="Footer">
        <Link to={ROUTES.home}>Home</Link>
        <Link to={ROUTES.pricing}>Pricing</Link>
        <Link to={ROUTES.about}>About</Link>
      </nav>
      <p>© {new Date().getFullYear()} Archon</p>
    </footer>
  )
}
