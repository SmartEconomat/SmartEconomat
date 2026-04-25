import './i18n/index';
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'wicg-inert';
import './index.css';
import * as Sentry from '@sentry/react';
import App from './App';
import reportWebVitals from './reportWebVitals';

const sentryDsn = String(import.meta.env.VITE_SENTRY_DSN || '').trim();
if (import.meta.env.MODE === 'production' && sentryDsn.length > 0) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
