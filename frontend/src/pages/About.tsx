import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'

export function About() {
  return (
    <div>
      <h1>About (stub)</h1>
      <p>About Archon coming soon.</p>
      <Link to={ROUTES.home}>← Back</Link>
    </div>
  )
}
