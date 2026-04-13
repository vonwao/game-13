import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { loadLegacyCore } from './shell/loadLegacyCore.js';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/app.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

async function bootstrap() {
  try {
    await loadLegacyCore();
  } catch (error) {
    console.error('Legacy game core failed to load:', error);
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
