#!/usr/bin/env node
// Bootstraps local dev: creates each service's .env from its .env.example
// (never overwriting one that already exists) and runs `npm install` in
// every service, so `npm run setup` is the only command a fresh clone needs
// before `docker compose up` or running each service's own `npm run dev`.

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SERVICES = ['backend', 'lanchain', 'client'];

function checkNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 22) {
    console.error(`✗ Node ${process.versions.node} detected — this project requires Node >= 22.`);
    process.exit(1);
  }
  console.log(`✓ Node ${process.versions.node}`);
}

function ensureEnvFile(service) {
  const dir = path.join(ROOT, service);
  const envPath = path.join(dir, '.env');
  const examplePath = path.join(dir, '.env.example');

  if (fs.existsSync(envPath)) {
    console.log(`✓ ${service}/.env already exists`);
    return;
  }
  if (!fs.existsSync(examplePath)) {
    console.warn(`! ${service}/.env.example not found — skipping`);
    return;
  }
  fs.copyFileSync(examplePath, envPath);
  console.log(`+ Created ${service}/.env from .env.example — fill in real values before running.`);
}

function installDeps(service) {
  const dir = path.join(ROOT, service);
  console.log(`\n> npm install (${service})`);
  execSync('npm install', { cwd: dir, stdio: 'inherit' });
}

function main() {
  checkNodeVersion();

  console.log('\nChecking env files...');
  SERVICES.forEach(ensureEnvFile);

  console.log('\nInstalling dependencies...');
  SERVICES.forEach(installDeps);
  execSync('npm install', { cwd: ROOT, stdio: 'inherit' });

  console.log(`
Setup complete. Next steps:
  1. Fill in real API keys in backend/.env, lanchain/.env, and client/.env
     (see each .env.example for what's required).
  2. Run each service in dev mode:
       cd backend  && npm start
       cd lanchain && npm run ingest   (or import its functions from backend)
       cd client   && npm run dev
     ...or bring up the whole stack with: docker compose --env-file client/.env up --build
  3. Run \`npm run healthcheck\` once everything is up to verify connectivity.
`);
}

main();
