import { loadAndSplitPdfBuffer } from "./parsing/pdfLoader.js";
import { getVectorStore, deleteCollection } from "./vectorStore.js";

// Parses, chunks, embeds, and upserts a PDF buffer into its own Qdrant
// collection (`collectionName`, i.e. Document.vectorNamespace). `metadata`
// (documentId, documentTitle, source, ...) is stamped onto every chunk so
// chain.js can cite which document/page an answer came from.
export async function ingestDocument({ buffer, collectionName, metadata = {} }) {
  if (!buffer) throw new Error("buffer is required");
  if (!collectionName) throw new Error("collectionName is required");

  const { documents, pageCount } = await loadAndSplitPdfBuffer(buffer, {
    ...metadata,
    collectionName,
  });

  if (documents.length === 0) {
    return { chunkCount: 0, pageCount };
  }

  const vectorStore = getVectorStore(collectionName);
  await vectorStore.addDocuments(documents);

  return { chunkCount: documents.length, pageCount };
}

export async function deleteDocumentVectors(collectionName) {
  await deleteCollection(collectionName);
}
