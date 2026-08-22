#!/usr/bin/env node
// Best-effort connectivity check across the local dev stack: HTTP for the
// two Node services, a raw TCP connect for Mongo/Qdrant (no driver
// dependency needed just to confirm something's listening). Exits non-zero
// if anything's down, so it's usable as a CI/compose gate later too.

const http = require('node:http');
const net = require('node:net');

const TIMEOUT_MS = 3000;

function checkHttp(name, url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: TIMEOUT_MS }, (res) => {
      res.resume();
      resolve({ name, ok: res.statusCode < 500, detail: `HTTP ${res.statusCode}` });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ name, ok: false, detail: 'timed out' });
    });
    req.on('error', (err) => resolve({ name, ok: false, detail: err.message || err.code || 'unreachable' }));
  });
}

function checkTcp(name, host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: TIMEOUT_MS });
    socket.on('connect', () => {
      socket.end();
      resolve({ name, ok: true, detail: `${host}:${port} reachable` });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ name, ok: false, detail: 'timed out' });
    });
    socket.on('error', (err) => resolve({ name, ok: false, detail: err.message || err.code || 'unreachable' }));
  });
}

async function main() {
  const checks = [
    checkHttp('backend', process.env.BACKEND_URL || 'http://localhost:8080/'),
    checkHttp('client', process.env.CLIENT_URL || 'http://localhost:3000/'),
    checkTcp('mongo', 'localhost', 27017),
    checkTcp('qdrant', 'localhost', 6333),
  ];

  const results = await Promise.all(checks);

  let allOk = true;
  for (const { name, ok, detail } of results) {
    console.log(`${ok ? '✓' : '✗'} ${name.padEnd(8)} ${detail}`);
    if (!ok) allOk = false;
  }

  if (!allOk) {
    console.error('\nOne or more services are unreachable.');
    process.exit(1);
  }
  console.log('\nAll services reachable.');
}

main();
