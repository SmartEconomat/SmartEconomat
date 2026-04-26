import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';

/**
 * @module main
 * Punto de entrada principal de la aplicación React.
 *
 * Monta el componente `App` en el nodo `#root` del DOM con StrictMode
 * activado para detectar efectos secundarios durante el desarrollo.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
