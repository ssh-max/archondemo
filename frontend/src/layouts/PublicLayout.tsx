import { Outlet } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'

export function PublicLayout() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}
