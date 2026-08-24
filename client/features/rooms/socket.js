import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

let socket;

// A single shared connection for the whole tab — RoomPage connects/enters
// on mount and exits/disconnects on unmount, same lifecycle as any other
// per-page data fetch. Auth mirrors client/lib/api.js's REST interceptor:
// the Clerk session token is fetched fresh and sent in the handshake
// (see backend/src/lib/socket.js authenticateSocket).
//
// `auth` is a callback (not a plain object) specifically so it re-fetches a
// fresh token on every reconnect, not just the first connect — Clerk
// session tokens are short-lived, so a plain object would resend the
// original (by-then-expired) token after any network blip and fail auth
// silently, leaving the client's presence/timer state stuck.
export async function connectSocket() {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: (cb) => {
      window.Clerk?.session
        ?.getToken()
        .then((token) => cb({ token }))
        .catch(() => cb({}));
    },
    transports: ["websocket", "polling"],
  });

  return new Promise((resolve, reject) => {
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (err) => reject(err));
  });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = undefined;
}

export function getSocket() {
  return socket;
}
