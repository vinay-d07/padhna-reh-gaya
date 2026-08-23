const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    // Dummy values so modules that validate config at require-time (e.g.
    // lib/supabase.js) don't throw just from being imported by a test that
    // never actually calls out to them.
    env: {
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SECRET_KEY: 'test-secret-key',
      REDIS_URL: 'redis://localhost:6379',
    },
  },
});
