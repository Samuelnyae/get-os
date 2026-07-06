import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register service worker for PWA / offline support (production only).
// In dev, Vite serves /src, /node_modules/.vite, /@vite, /@react-refresh dynamically
// and they change on every rebuild — a cache-first SW would serve stale JS,
// causing "Cannot read properties of null (reading 'useState')" and similar
// React hook errors from mismatched/stale chunks.
if (import.meta.env.DEV) {
  // Unregister any previously-installed service worker and clear its caches
  // so stale dev JS doesn't persist from a prior production build.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      if (window.caches) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    });
  }
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}