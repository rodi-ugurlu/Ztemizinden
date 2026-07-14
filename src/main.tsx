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

window.requestAnimationFrame(() => {
  window.setTimeout(() => void initializeAuth(), 0)
})
