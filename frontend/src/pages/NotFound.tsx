import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'

export function NotFound() {
  return (
    <div>
      <h1>404 — Not Found</h1>
      <p>This page doesn't exist.</p>
      <Link to={ROUTES.home}>Go home</Link>
    </div>
  )
}
