console.log("🚀 Menu Decoder initialized");

window.addEventListener('error', (event) => {
  alert(`Runtime Error: ${event.message}\nAt: ${event.filename}:${event.lineno}`);
});

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const container = document.getElementById('root');
  if (!container) throw new Error("Root container not found");
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err) {
  alert(`Render Error: ${err.message}`);
}

