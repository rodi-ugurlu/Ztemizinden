import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeAuth } from './store/useAuthStore.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const isIdentityLoginEntry = /^\/(customer|service|admin)\/login\/?$/.test(
  window.location.pathname
)

if (!isIdentityLoginEntry) {
  window.requestAnimationFrame(() => {
    window.setTimeout(() => void initializeAuth(), 0)
  })
}
