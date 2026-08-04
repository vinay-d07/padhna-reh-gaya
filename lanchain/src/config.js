// Loaded by path (not the default `dotenv/config`, which resolves against
// process.cwd()) because this package is imported from the backend process,
// whose cwd is `backend/`, not `lanchain/`.
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const QDRANT_URL = () => required("QDRANT_URL");
export const QDRANT_API_KEY = () => process.env.QDRANT_API_KEY || undefined;

export const GROQ_API_KEY = () => required("GROQ_API_KEY");
export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";

export const CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE) || 1000;
export const CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP) || 150;
export const RETRIEVAL_K = Number(process.env.RAG_RETRIEVAL_K) || 6;

// Per-document collection top-k before merging results across a workspace's
// documents. Higher than RETRIEVAL_K so a document with several relevant
// chunks isn't crowded out when merging with other documents.
export const PER_COLLECTION_K = Number(process.env.RAG_PER_COLLECTION_K) || 8;

// Pages with fewer text items or less extractable text than this are treated
// as flattened images (no real text layer) and routed through OCR.
export const OCR_MIN_TEXT_ITEMS = 10;
export const OCR_MIN_TEXT_LENGTH = 100;

// Scale factor used to rasterize a PDF page before OCR — higher improves
// accuracy at the cost of speed.
export const OCR_RENDER_SCALE = 3;
