import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { EMBEDDING_MODEL } from "./config.js";

let embeddingsInstance;

// Runs fully locally via @huggingface/transformers (onnxruntime) — model
// weights download once on first use and are cached, no API key or
// per-chunk network call.
export function getEmbeddings() {
  if (!embeddingsInstance) {
    embeddingsInstance = new HuggingFaceTransformersEmbeddings({
      model: EMBEDDING_MODEL,
    });
  }
  return embeddingsInstance;
}
