import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Mounted inside BrowserRouter, above Routes. Resets scroll position and
 * moves keyboard focus to the main content area on every navigation.
 * Falls back gracefully if neither #main-content nor a <main> element exists.
 */
export function RouteChrome() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)

    const target =
      document.getElementById('main-content') ??
      document.querySelector('main') ??
      document.body

    target.setAttribute('tabindex', '-1')
    // preventScroll so focus() doesn't fight the explicit scrollTo above.
    target.focus({ preventScroll: true })
  }, [pathname])

  return null
}
