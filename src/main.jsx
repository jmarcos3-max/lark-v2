import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

function showBootError(message) {
  const root = document.getElementById('root')
  if (!root) return
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;background:#080808;color:#f0eef6;font-family:system-ui,sans-serif">
      <p style="font-size:14px;font-weight:600;margin:0">Lark failed to load</p>
      <p style="font-size:12px;max-width:420px;opacity:0.75;margin:0">${message}</p>
      <button type="button" onclick="location.reload()" style="font-size:12px;padding:8px 14px;border-radius:8px;border:1px solid rgba(139,92,246,0.4);background:transparent;color:#a78bfa;cursor:pointer">
        Reload
      </button>
    </div>
  `
}

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (error) {
  showBootError(error instanceof Error ? error.message : String(error))
}

window.addEventListener('error', (event) => {
  if (document.getElementById('root')?.childElementCount) return
  showBootError(event.message || 'Unexpected script error')
})

window.addEventListener('unhandledrejection', (event) => {
  if (document.getElementById('root')?.childElementCount) return
  const reason = event.reason
  showBootError(reason instanceof Error ? reason.message : String(reason))
})
