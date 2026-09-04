"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { registerTokenGetter } from "@/lib/api";

// Registers Clerk's getToken with the shared axios instance as soon as
// Clerk has finished loading — see the comment in lib/api.js for why this
// exists instead of reading `window.Clerk` directly in the interceptor.
export default function AuthTokenBridge() {
  const { isLoaded, getToken } = useAuth();

  useEffect(() => {
    if (isLoaded) registerTokenGetter(getToken);
  }, [isLoaded, getToken]);

  return null;
}
