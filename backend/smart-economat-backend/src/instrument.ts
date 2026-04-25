import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const sentryDsn = process.env.SENTRY_DSN?.trim() ?? '';
const sentryEnabled =
  process.env.NODE_ENV === 'production' && sentryDsn.length > 0;

Sentry.init({
  dsn: sentryDsn,
  enabled: sentryEnabled,
  environment: process.env.NODE_ENV || 'development',
  integrations: [nodeProfilingIntegration()],

  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
