// src/renderer/src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Import Tailwind CSS

// Ensure the 'api' object is available in the window context
// This check helps prevent runtime errors if the preload script hasn't loaded correctly
if (!window.api) {
  console.error('Electron API not available. Ensure preload script is loaded correctly.')
  // Optionally, you could display an error message to the user or prevent the app from rendering.
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
