import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Every request needs a fresh Clerk session token, but on a cold page load
// components can fire their first fetch before Clerk finishes hydrating —
// e.g. landing directly on a /chat/[conversationId] URL mounts ChatPanel
// (and its getMessages call) immediately. AuthTokenBridge registers the
// officially-supported `useAuth().getToken` once Clerk's `isLoaded` is true.
//
// This polls the registered getter rather than gating on a one-shot promise:
// a one-shot "resolve once, ever" gate can go permanently stale under hot
// reload (a fresh, unresolved gate replaces the old one if the module gets
// re-evaluated without AuthTokenBridge's effect re-firing to resolve it),
// which hangs every request forever instead of just delaying the first one.
// Polling self-heals — it only ever waits out a bounded timeout.
let tokenGetter = null;

export function registerTokenGetter(getToken) {
  tokenGetter = getToken;
}

async function waitForTokenGetter(timeoutMs = 5000) {
  const start = Date.now();
  while (!tokenGetter && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return tokenGetter;
}

// For call sites that can't go through the axios instance (e.g. the chat
// SSE stream, which needs a raw fetch to read the response body).
export async function getAuthToken() {
  const getter = await waitForTokenGetter();
  return (await getter?.()) ?? null;
}

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const getter = await waitForTokenGetter();
    const token = await getter?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
