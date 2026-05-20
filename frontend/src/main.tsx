import React from 'react'
import ReactDOM from 'react-dom/client'
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
    <App />
  </React.StrictMode>,
)
