# Padhle — Resume-Worthy Feature Roadmap

## Context

Padhle is a full-stack AI study platform (Next.js 16 client + Express 5/Prisma/MongoDB backend + a
LangChain-based RAG service called `lanchain`) that lets users upload documents into shared
workspaces, chat with them via citation-grounded RAG, and get auto-generated summaries and
flashcards. The core AI pipeline already works: multiformat ingestion (PDF/DOCX/PPTX/TXT with OCR
fallback), Qdrant vector search, Groq-backed streaming chat, and flashcard/summary generation were
just shipped.

What's missing is everything that turns "a working AI demo" into a **resume-worthy project**:
there are zero automated tests, no CI/CD, no containerization, no background job handling (document
ingestion is a fire-and-forget async call with no retries), no observability, and no differentiating
product features beyond basic flashcards. `docker/`, `docs/`, and both setup scripts are empty
stubs. The `security:added-jwt` commits are actually just Clerk/RBAC wiring — there's no real
security hardening (rate limiting, helmet, structured logs) either.

The goal of this roadmap is to close both gaps at once — for **recruiters**, a polished, live,
demo-able product with standout features (spaced repetition, quizzes, real-time collaboration); for
**engineers**, visible signs of production maturity (tests, CI/CD, service boundaries, job queues,
observability). Phases are sized as weekend-to-2-week increments, ordered so foundational
credibility work comes first and the flashiest product features come once the base is solid.

Sources consulted for what recruiters/engineers actually look for: source-citation RAG,
production deployment over notebooks, clean READMEs with live links, and measurable
results ([Scaler](https://www.scaler.com/blog/10-ai-portfolio-projects-to-land-your-dream-job-2026/),
[InterviewQuery](https://www.interviewquery.com/p/ai-project-ideas)); SM-2/FSRS spaced-repetition
mechanics for the flashcard upgrade ([dev.to SM-2 writeup](https://dev.to/chelsy/how-i-implemented-the-sm-2-spaced-repetition-algorithm-in-my-flashcard-app-54g9),
[repetit.net](https://repetit.net/blog/sm2-algorithm/)).

---

## Phase 0 — Foundation & Hygiene (weekend)
**Why:** This is the first thing a technical reviewer checks — no tests/CI is an instant red flag,
and empty `docker/`/`docs/` folders look unfinished even if the app works.

- Backend: unit tests (Vitest/Jest) for `modules/*/services.js` business logic and `middleware/access.js` RBAC rules.
- `lanchain`: unit tests for `parsing/*` (pdf/docx/pptx chunking) and `study.js` flashcard JSON parsing/cleanup — these have the most edge-case logic in the repo.
- One E2E smoke test (Playwright) covering: sign in → create workspace → upload doc → wait for READY → ask a question → get cited answer.
- GitHub Actions CI: lint + test + build on every PR for all three services.
- Dockerfiles for `client`, `backend`, `lanchain`; a root `docker-compose.yml` wiring them up with MongoDB, Qdrant, and Redis for one-command local dev.
- Implement the empty `scripts/setup.js` (bootstrap env files, install deps across services) and `scripts/healthcheck.js` (ping each service + its dependencies).
- Remove the duplicated `eng.traineddata` (5MB) from `backend/` — OCR only runs in `lanchain`.
- Populate `docs/` with an architecture diagram (client ↔ backend ↔ lanchain ↔ Qdrant/Mongo/Supabase) and a short ADR on why `lanchain` is in-process today.
- README overhaul: architecture diagram, live demo link (placeholder until Phase 6), setup instructions via the new `scripts/setup.js`, badges (CI status, license).

## Phase 1 — Architecture Hardening (1 week)
**Why:** Shows systems-design maturity: service boundaries, resilience, and basic hardening — the
things that separate "a script that works" from "a service you'd trust in production."

- Background job queue (BullMQ + Redis) for document ingestion, replacing the current unawaited
  async call in `backend/src/modules/uploads/services.js`. Add retry with backoff and a
  dead-letter state so a crash mid-ingestion doesn't strand a document at `PROCESSING` forever.
- Give ingestion progress to the client (poll or WebSocket) instead of just a final status flip.
- Turn `lanchain` into a real internal HTTP service (Express/Fastify) instead of `backend/src/lib/rag.js` dynamically importing it by relative path — enables independent deploys/scaling and is the more defensible answer to "why is this structured this way?" in an interview.
- Backend hardening: `helmet`, request rate limiting (`express-rate-limit`), input validation (`zod`) on all route bodies, centralized error-handling middleware.
- Structured logging (`pino`) across backend and lanchain; wire up Sentry (or similar) for error tracking in both.
- OpenAPI/Swagger spec for the backend REST API, served at `/docs`.

## Phase 2 — Core Differentiators (1–2 weeks)
**Why:** These are the features that make Padhle more than "yet another chat-with-PDF clone" —
concrete, demo-able, and technically interesting (an algorithm, not just an LLM call).

- **Spaced repetition study mode**: implement SM-2 (or FSRS) scheduling on top of the existing
  `Flashcard` model — add `easeFactor`, `interval`, `dueDate`, `repetitions` fields; a "Review"
  queue UI (Again/Hard/Good/Easy grading) replacing the current plain flip-through; study streak
  tracking surfaced on the dashboard. This is the single highest-leverage feature — it's a real
  algorithm, not just another LLM wrapper.
- **Quiz mode**: LLM-generated multiple-choice quizzes per document (parallel to `generateFlashcards` in `lanchain/src/study.js`), scored, with a results view and history stored via the existing `Activity` model.
- **Workspace-wide semantic search**: search across all documents/notes/summaries in a workspace (today, chat/search is scoped per-document-selection only) — a search bar hitting Qdrant across the workspace's collections.
- **Concept/mind-map view**: auto-generate a visual concept graph per document from the LLM (nodes = key concepts, edges = relationships) — highly demo-able, differentiates from plain text summaries.
- **Export**: flashcards → Anki `.apkg`, summaries/notes → PDF/Markdown download.

## Phase 3 — Collaboration & Real-Time (1 week)
**Why:** Workspaces already model multi-user roles (Owner/Editor/Viewer) but nothing is actually
real-time — this phase makes the collaboration story real, which is a strong systems-design talking point (WebSockets/CRDTs).

- Real-time presence in a workspace (who's online/viewing) via Socket.io.
- Collaborative note editing: upgrade the existing Tiptap editor with the Yjs collaboration extension for live multi-cursor editing.
- Lightweight notifications (in-app bell + optional email digest) for workspace activity (new upload ready, someone commented, etc.), built on the existing `Activity` model.
- Comments/annotations anchored to a document or note.

## Phase 4 — Growth & SaaS Layer (1 week)
**Why:** Demonstrates product thinking beyond pure engineering — the kind of feature set that turns
a demo into "this looks like a real product I could imagine paying for."

- Public read-only share links for a single flashcard deck, summary, or note (no login required to view).
- Usage quotas per plan (e.g., free tier: N documents, N AI generations/month) enforced server-side.
- Stripe integration (test mode is fine) for a paid tier gating quotas — shows payment/webhook integration skill even without a real business behind it.
- Guided onboarding: sample workspace with a pre-loaded document so a new user (or recruiter) sees value in under a minute without uploading anything.

## Phase 5 — Polish, Performance & Observability (weekend)
**Why:** The "quality bar" pass — the difference between something that works in a demo and
something that would hold up under real usage, and it's easy to show before/after metrics on a resume bullet.

- Redis caching for repeated RAG queries and generated summaries (cache key: document + question hash).
- Measure and document RAG latency (time-to-first-token, end-to-end) — publish the numbers in the README ("cut average query latency from Xs to Yms via caching").
- Accessibility pass: keyboard navigation, ARIA labels, color-contrast check across `client/`.
- Mobile responsiveness pass on the workspace/chat UI.
- Confirm/complete dark-light theme support against `client/design.md` tokens.

## Phase 6 — Deployment & Demo Readiness (weekend)
**Why:** A live, working link is worth more than any bullet point — this is what recruiters actually click.

- Deploy: client → Vercel, backend + lanchain → Render/Fly/Railway, MongoDB Atlas, managed Qdrant Cloud.
- Custom domain + uptime monitoring (UptimeRobot/Better Stack) — and link the status publicly.
- Wire the Phase 0 GitHub Actions CI to auto-deploy on merge to `main`.
- Seed a public demo account/workspace so anyone can try the app without signing up.
- Record a 30–60s demo GIF/video for the top of the README.

## Stretch / Optional (Phase 7)
Pick 1–2 if time remains — these are higher-novelty but lower-priority than the phases above:
- Multi-provider LLM abstraction (swap Groq for OpenAI/Anthropic via config) to show a clean provider interface.
- Browser extension to clip a web page directly into a workspace.
- Voice input for chat + TTS playback of summaries.
- PWA installability / offline-readable notes.

---

## Suggested Priority If Time-Constrained
1. **Phase 0** (non-negotiable — credibility floor)
2. **Phase 2's spaced repetition** (single best "wow" feature, real algorithm)
3. **Phase 6** (a dead link kills everything else)
4. **Phase 1** (engineering-interview talking points)
5. Phases 3–5 as time allows, roughly in that order.

## Verification
Each phase should end with the app actually run end-to-end locally (`docker compose up` after
Phase 0) and the new feature exercised manually in the browser; from Phase 0 onward, CI (lint +
test + build) must pass on every PR before merging. Deployment readiness (Phase 6) is verified by
loading the live URL from a fresh browser/incognito session and completing the full upload → chat →
flashcard-review flow without any local setup.
