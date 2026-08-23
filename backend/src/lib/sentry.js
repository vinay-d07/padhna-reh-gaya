// Error tracking is opt-in: without SENTRY_DSN set, Sentry.init() is never
// called and every exported hook below is a no-op, so local dev and CI never
// need a Sentry account. Set SENTRY_DSN in production to turn it on.
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  });
}

module.exports = Sentry;
