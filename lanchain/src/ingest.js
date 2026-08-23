import { loadAndSplitPdfBuffer } from "./parsing/pdfLoader.js";
import { loadAndSplitDocxBuffer, loadAndSplitPptxBuffer } from "./parsing/officeLoader.js";
import { splitPages } from "./parsing/genericLoader.js";
import { getVectorStore, deleteCollection } from "./vectorStore.js";
import logger from "./logger.js";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

function parseBuffer(buffer, mimeType, metadata) {
  switch (mimeType) {
    case "application/pdf":
    case undefined:
      return loadAndSplitPdfBuffer(buffer, metadata);
    case DOCX_MIME:
      return loadAndSplitDocxBuffer(buffer, metadata);
    case PPTX_MIME:
      return loadAndSplitPptxBuffer(buffer, metadata);
    case "text/plain":
      return splitPages([{ page: 1, text: buffer.toString("utf-8") }], metadata);
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

// Parses, chunks, embeds, and upserts a document buffer into its own Qdrant
// collection (`collectionName`, i.e. Document.vectorNamespace). `metadata`
// (documentId, documentTitle, source, ...) is stamped onto every chunk so
// chain.js can cite which document/page an answer came from.
export async function ingestDocument({ buffer, collectionName, mimeType, metadata = {} }) {
  if (!buffer) throw new Error("buffer is required");
  if (!collectionName) throw new Error("collectionName is required");

  const startedAt = Date.now();
  logger.info({ collectionName, mimeType, bytes: buffer.length }, "ingestion started");

  try {
    const { documents, pageCount } = await parseBuffer(buffer, mimeType, {
      ...metadata,
      collectionName,
    });

    if (documents.length === 0) {
      logger.warn({ collectionName, pageCount }, "ingestion produced no chunks");
      return { chunkCount: 0, pageCount };
    }

    const vectorStore = getVectorStore(collectionName);
    await vectorStore.addDocuments(documents);

    logger.info(
      { collectionName, pageCount, chunkCount: documents.length, durationMs: Date.now() - startedAt },
      "ingestion completed"
    );
    return { chunkCount: documents.length, pageCount };
  } catch (error) {
    logger.error({ collectionName, err: error, durationMs: Date.now() - startedAt }, "ingestion failed");
    throw error;
  }
}

export async function deleteDocumentVectors(collectionName) {
  await deleteCollection(collectionName);
  logger.info({ collectionName }, "vectors deleted");
}
