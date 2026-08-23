const IORedis = require('ioredis');
const logger = require('./logger');

// BullMQ requires this exact option on any connection it's handed —
// without it ioredis gives up retrying blocking commands after one failure.
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// ioredis emits 'error' on every failed reconnect attempt — without a
// listener, an unreachable Redis (e.g. in a test run, or before `docker
// compose up` finishes starting it) would crash the process.
connection.on('error', (error) => {
  logger.warn({ err: error }, 'Redis connection error');
});

module.exports = connection;
