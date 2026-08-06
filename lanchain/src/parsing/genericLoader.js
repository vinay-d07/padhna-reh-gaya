import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CHUNK_OVERLAP, CHUNK_SIZE } from "../config.js";

// Splits already-extracted plain text into embeddable chunks. Used for
// formats without pdfLoader's page-aware parsing (docx, txt, and each pptx
// slide) — chunks carry `page`/`chunk` metadata but not the markdown
// table/bullet structure the PDF path reconstructs.
export async function splitPages(pages, metadata = {}) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const documents = [];
  for (const { page, text } of pages) {
    if (!text?.trim()) continue;
    const chunks = await splitter.splitText(text);
    chunks.forEach((chunk, i) => {
      documents.push(
        new Document({
          pageContent: chunk,
          metadata: { ...metadata, page, chunk: i },
        })
      );
    });
  }

  return { documents, pageCount: pages.length };
}
