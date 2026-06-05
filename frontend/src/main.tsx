import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { ROUTES } from './routes'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { PublicLayout } from './layouts/PublicLayout'
import { ProtectedLayout } from './layouts/ProtectedLayout'
import { RouteChrome } from './components/RouteChrome'
import { LoginScreen } from './components/LoginScreen'
import { Landing } from './pages/Landing'
import { Pricing } from './pages/Pricing'
import { About } from './pages/About'
import { NotFound } from './pages/NotFound'
import App from './App.tsx'
import mermaid from 'mermaid'
import type { IconifyJSON } from '@iconify/types'
import { icons as logosIcons } from '@iconify-json/logos'

mermaid.initialize({ startOnLoad: false })

mermaid.registerIconPacks([
  { name: logosIcons.prefix, icons: logosIcons },
])

fetch('https://raw.githubusercontent.com/NakayamaKento/AzureIcons/refs/heads/main/icons.json')
  .then(r => r.json())
  .then((azureIcons: IconifyJSON) => {
    mermaid.registerIconPacks([{ name: azureIcons.prefix || 'azure', icons: azureIcons }])
  })
  .catch(() => {/* silently continue with built-in icons only */})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <RouteChrome />
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route element={<PublicLayout />}>
              <Route path={ROUTES.home}    element={<Landing />} />
              <Route path={ROUTES.pricing} element={<Pricing />} />
              <Route path={ROUTES.about}   element={<About />} />
            </Route>
            <Route path={ROUTES.login} element={<LoginScreen />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<ProtectedLayout />}>
              <Route path={ROUTES.app} element={<App />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
