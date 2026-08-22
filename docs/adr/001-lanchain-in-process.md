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
  PDF) takes down the same process handling unrelated API requests.
- Document ingestion currently runs as an unawaited async call inside the
  request process (`uploadDocument` → `ingestDocumentInBackground`) with no
  retry or dead-letter handling — a process restart mid-ingestion strands
  the document at `PROCESSING` forever.

## Planned change

Phase 1 of `features.md` covers splitting this into a real internal HTTP
service (Express/Fastify) fronted by a background job queue (BullMQ +
Redis) for ingestion specifically — decoupling `lanchain`'s deploy/scale
lifecycle from `backend`'s and adding retry semantics for ingestion.
