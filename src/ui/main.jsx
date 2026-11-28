import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerHybridServiceWorker } from '../db/database.js';
import App from './App.jsx';

registerHybridServiceWorker();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root mount element (#root) was not found in index.html.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
