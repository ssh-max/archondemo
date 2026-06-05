import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'

export function Pricing() {
  return (
    <div>
      <h1>Pricing (stub)</h1>
      <p>Plans and pricing coming soon.</p>
      <Link to={ROUTES.home}>← Back</Link>
    </div>
  )
}
