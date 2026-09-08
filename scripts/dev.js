#!/usr/bin/env node
// Personal-use local dev runner: starts the api, worker, and web (client)
// services as plain Node processes — no Docker. Each service still reads
// its own .env (backend/.env, lanchain/.env, client/.env — see
// `npm run setup`), so Mongo/Qdrant/Redis can be local or cloud, whatever
// those files already point at. This script only orchestrates the three
// processes: prefixed/colored output, and Ctrl+C stops all three together.

const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..');

const SERVICES = [
  {
    name: 'api',
    color: 36, // cyan
    cwd: 'backend',
    // nodemon (already a backend devDependency) restarts on save; swap in
    // `npm start` if you'd rather not auto-restart.
    command: 'npx nodemon --watch src --ext js,json src/index.js',
  },
  {
    name: 'worker',
    color: 35, // magenta
    cwd: 'backend',
    command: 'npx nodemon --watch src --ext js,json src/worker.js',
  },
  {
    name: 'web',
    color: 33, // yellow
    cwd: 'client',
    command: 'npm run dev',
  },
];

function checkEnvFiles() {
  const missing = ['backend', 'lanchain', 'client'].filter(
    (service) => !fs.existsSync(path.join(ROOT, service, '.env'))
  );
  if (missing.length) {
    console.error(
      `✗ Missing .env for: ${missing.join(', ')}. Run \`npm run setup\` first, then fill in real values.`
    );
    process.exit(1);
  }
}

function label(service) {
  return `\x1b[${service.color}m[${service.name}]\x1b[0m`;
}

function pipeWithPrefix(service, readable, writable) {
  let buffered = '';
  readable.on('data', (chunk) => {
    buffered += chunk.toString();
    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop(); // last entry is a partial line (or '') — hold it
    for (const line of lines) writable.write(`${label(service)} ${line}\n`);
  });
  readable.on('end', () => {
    if (buffered) writable.write(`${label(service)} ${buffered}\n`);
  });
}

const children = [];
let shuttingDown = false;

function killAll(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode != null || child.signalCode != null) continue;
    if (process.platform === 'win32') {
      // Plain child.kill() only signals the shell wrapper on Windows, not
      // the nodemon/next process underneath it — taskkill /T walks the tree.
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
    } else {
      try {
        process.kill(-child.pid, signal); // negative pid = whole process group
      } catch {
        child.kill(signal);
      }
    }
  }
}

function start(service) {
  // Passed as a single command string (not `command, argsArray`) so Node
  // doesn't emit the DEP0190 shell-argument-escaping warning — safe here
  // since every command above is a fixed literal, not user input.
  const child = spawn(service.command, {
    cwd: path.join(ROOT, service.cwd),
    shell: true,
    // New process group on POSIX so killAll can take out nodemon's/next's
    // own children too, not just the shell wrapper.
    detached: process.platform !== 'win32',
    env: process.env,
  });
  children.push(child);

  pipeWithPrefix(service, child.stdout, process.stdout);
  pipeWithPrefix(service, child.stderr, process.stderr);

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    console.log(`${label(service)} exited (${signal || code}) — stopping the other services.`);
    process.exitCode = code || 1;
    killAll('SIGTERM');
    setTimeout(() => process.exit(process.exitCode), 500);
  });

  return child;
}

function main() {
  checkEnvFiles();
  console.log('Starting api, worker, and web — Ctrl+C to stop all three.\n');
  SERVICES.forEach(start);
}

process.on('SIGINT', () => {
  killAll('SIGINT');
  setTimeout(() => process.exit(0), 500);
});
process.on('SIGTERM', () => {
  killAll('SIGTERM');
  setTimeout(() => process.exit(0), 500);
});

main();
