# Padhle

Padhle is a full-stack AI study platform. Upload your documents into shared workspaces, chat with them using a RAG-powered assistant, and get auto-generated summaries, flashcards, and notes — all backed by citation-grounded answers instead of hallucinated ones.

## Features

- **Workspaces** — organize documents, chats, and notes per subject/project, with role-based collaboration (Owner / Editor / Viewer).
- **Document chat (RAG)** — ask questions over one or more uploaded documents and get streaming, source-cited answers.
- **Auto summaries & flashcards** — every processed document gets an AI-generated summary and a flashcard deck for revision.
- **Rich-text notes** — a Tiptap-based editor for notes that can be linked to specific chat conversations.
- **Activity dashboard** — tracks uploads, chats, and study activity across a workspace.
- **Document ingestion pipeline** — PDF/DOCX parsing with OCR fallback (Tesseract) for scanned pages, chunked and embedded for retrieval, processed by a background job queue (BullMQ + Redis) with automatic retry and a recoverable failure state.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, Tiptap, Clerk (auth) |
| Backend API | Node.js, Express 5, Prisma, MongoDB, Clerk (auth middleware), BullMQ + Redis (job queue), Zod (validation), Pino (logging), OpenAPI/Swagger UI at `/docs` |
| RAG pipeline | LangChain, HuggingFace embeddings, Qdrant (vector store), Groq (LLM), pdf.js + Tesseract.js (parsing/OCR) |
| Storage | Supabase |

## Project Structure

```
padhle/
├── client/     # Next.js frontend (App Router)
├── backend/    # Express API + Prisma/MongoDB schema
├── lanchain/   # RAG pipeline: ingestion, embeddings, retrieval, chat
├── docker/     # Container configs
├── docs/       # Project documentation
└── scripts/    # Setup / healthcheck scripts
```

## Getting Started

Each service has its own `package.json` and env config.

```bash
# Frontend
cd client && npm install && npm run dev

# Backend API
cd backend && npm install && npm start

# Backend ingestion worker (needs Redis running — see docker-compose.yml)
cd backend && npm run worker

# RAG ingestion pipeline
cd lanchain && npm install && npm run ingest
```

Required environment variables (per service `.env`): `DATABASE_URL` (MongoDB), Clerk keys, `SUPABASE_URL` / `SUPABASE_SECRET_KEY`, `QDRANT_URL` / `QDRANT_API_KEY`, `REDIS_URL`, `HUGGINGFACEHUB_API_TOKEN`, `GROQ_API_KEY`.

With the backend running, the API reference is at `http://localhost:8080/docs` (OpenAPI spec: `backend/src/openapi.yaml`).

> Node.js >= 22 is required (see `engines` in `package.json`).
