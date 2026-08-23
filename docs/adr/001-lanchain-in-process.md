# ADR-001: lanchain runs in-process with backend, not as its own service

## Status

Accepted (current state) — planned to change, see Consequences.

## Context

`lanchain` implements the whole RAG pipeline: document parsing/OCR,
chunking, local embeddings, Qdrant access, and Groq-backed chat/summary/
flashcard generation. It's an ESM package (several of its dependencies —
`pdfjs-dist`, `@huggingface/transformers` — are ESM-only), while `backend`
is CommonJS (Express 5, `require()`-based modules throughout).

`backend/src/lib/rag.js` bridges the two with a cached dynamic import of a
relative path:

```js
function loadRag() {
  if (!ragPromise) ragPromise = import('../../../lanchain/src/index.js');
  return ragPromise;
}
```

This works because Node allows a CommonJS module to `import()` an ESM
module at runtime. No network hop, no serialization — `backend` calls
`lanchain`'s exported functions (`ingestDocument`, `streamAnswer`,
`generateSummary`, `generateFlashcards`, `deleteDocumentVectors`) directly.

## Decision

Keep the in-process call for now rather than standing up `lanchain` as its
own HTTP service.

## Consequences

**What this buys us today:** no HTTP/serialization overhead for streaming
chat responses, no second service to deploy/monitor, and one fewer network
boundary while the product is still a single-team, pre-scale project.

**What it costs:**
- `backend` and `lanchain` must always be deployed together, in the same
  filesystem/container (see `backend/Dockerfile`, which builds from the
  repo root specifically to satisfy this).
- `lanchain` can't be scaled independently of `backend`, even though it's
  the more resource-intensive half (local embedding inference, OCR).
- A crash inside `lanchain` (e.g. an unhandled parsing error on a malformed
  PDF) still takes down the same process handling unrelated API requests —
  this is now true of `worker` rather than `api` (see below), which is a
  smaller blast radius but not the full fix.

**Update (Phase 1):** the "no retry/dead-letter handling" cost above is
resolved without the full HTTP-service split. Ingestion now runs on a
BullMQ + Redis job queue (`backend/src/lib/queue.js`,
`backend/src/jobs/ingestionWorker.js`), consumed by a separate `worker`
process/container (`backend/src/worker.js`, the `worker` service in
`docker-compose.yml`) rather than inline in the request process. Jobs get
3 attempts with exponential backoff; a document that exhausts retries
flips to `FAILED` and its BullMQ job is kept (not `removeOnFail`'d) as the
dead-letter record, recoverable via `POST /documents/:id/retry`. This
already decouples ingestion's *execution* from the API process — `lanchain`
itself is still `require`d in-process by both `api` and `worker` (same
image, same dynamic-import bridge below), so the remaining costs (can't
scale/deploy `lanchain` independently, still built into the same image)
stand as-is.

## Planned change

Splitting `lanchain` into its own HTTP service (Express/Fastify), so it can
be deployed and scaled independently of `backend`/`worker`, remains
deferred — revisit if `lanchain`'s resource profile (embedding inference,
OCR) actually becomes a bottleneck shared with the API, or scaling
`backend` and `lanchain` independently becomes a real requirement.
