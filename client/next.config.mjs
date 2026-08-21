import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The root package.json (added for Playwright E2E tooling) gives the repo
  // a second lockfile, which makes Turbopack's workspace-root inference
  // guess wrong and pick the repo root instead of client/. Pin it explicitly.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
