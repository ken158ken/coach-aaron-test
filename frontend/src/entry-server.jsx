import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App.jsx'

export function render(url) {
  // Remove query string and hash for routing
  const pathname = url.split('?')[0].split('#')[0]
  
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={pathname} future={{ v7_relativeSplatPath: true }}>
        <App />
      </StaticRouter>
    </StrictMode>
  )
  return { html }
}
