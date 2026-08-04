import { getEmbeddings } from "../src/embeddings.js";

const embeddings = getEmbeddings();
const vectors = await embeddings.embedDocuments([
  "The quick brown fox jumps over the lazy dog.",
  "Qdrant is a vector database used for similarity search.",
]);

console.log("vector count:", vectors.length);
console.log("dimensions:", vectors[0].length);
console.log("sample:", vectors[0].slice(0, 5));
