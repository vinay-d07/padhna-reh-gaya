# E2E tests

Playwright smoke tests against the `client` app. Run from the repo root:

```bash
npm install
npx playwright install --with-deps chromium
npm run e2e
```

By default this starts `client`'s dev server for you (`npm run dev` in
`client/`), so `client/.env` needs to be populated first (see
`client/.env.example`). Point at an already-running instance instead with
`E2E_BASE_URL=http://localhost:3000 npm run e2e`.

## What's covered vs. not

`landing.spec.js` only exercises the unauthenticated landing page — that's
everything reachable without a real Clerk session. The full golden path
(sign in → create workspace → upload a document → chat → generate
flashcards) needs a signed-in session, which requires wiring up [Clerk
Testing Tokens](https://clerk.com/docs/testing/overview) (a
`CLERK_SECRET_KEY` plus `@clerk/testing`'s Playwright helpers) so CI can
authenticate without a real browser login. That's tracked as follow-up work
rather than faked here — a green check on a stubbed auth flow would be worse
than an honestly narrow smoke test.
