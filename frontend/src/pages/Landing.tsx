import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'

export function Landing() {
  return (
    <div>
      <h1>Landing (stub)</h1>
      <p>Archon — enterprise architecture advisor.</p>
      <nav>
        <Link to={ROUTES.pricing}>Pricing</Link>
        {' · '}
        <Link to={ROUTES.about}>About</Link>
        {' · '}
        <Link to={ROUTES.login}>Sign in</Link>
      </nav>
    </div>
  )
}
