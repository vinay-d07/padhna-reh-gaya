import { readFileSync } from "node:fs";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CHUNK_OVERLAP, CHUNK_SIZE } from "../config.js";
import { parsePdfPages } from "./pdfParser.js";

// Renders one normalized page result (see pdfParser.js) to markdown so
// structure survives into the chunk text instead of being flattened: a
// table stays a table, bullets stay "- " lines.
export function formatPageMarkdown(pageResult) {
  let markdown = "";
  if (pageResult.title) {
    markdown += `# ${pageResult.title.trim()}\n\n`;
  }

  if (pageResult.type === "table" && Array.isArray(pageResult.rows)) {
    markdown += "| Principle | Description |\n| --- | --- |\n";
    for (const row of pageResult.rows) {
      markdown += `| ${row.principle || ""} | ${row.description || ""} |\n`;
    }
  } else if (pageResult.type === "bullets" && Array.isArray(pageResult.bullets)) {
    for (const bullet of pageResult.bullets) {
      markdown += `- ${bullet}\n`;
    }
  } else if (Array.isArray(pageResult.content)) {
    for (const item of pageResult.content) {
      if (item?.type === "bullet") {
        markdown += `- ${item.text || ""}\n`;
      } else if (item?.text) {
        markdown += `${item.text}\n`;
      }
    }
  }

  return markdown.trim();
}

// Parses a PDF buffer, formats each page to markdown, and splits it into
// LangChain Documents ready to embed. `metadata` is merged onto every chunk
// (typically { source, documentId }) alongside the per-chunk { page, title,
// chunk } fields. Pages that format to empty markdown (title-only /
// section-divider slides) are skipped so they don't contribute noisy
// vectors.
export async function loadAndSplitPdfBuffer(buffer, metadata = {}) {
  const pages = await parsePdfPages(buffer);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const documents = [];
  for (const pageResult of pages) {
    const pageText = formatPageMarkdown(pageResult);
    if (!pageText) continue;

    const chunks = await splitter.splitText(pageText);
    chunks.forEach((chunk, i) => {
      documents.push(
        new Document({
          pageContent: chunk,
          metadata: {
            ...metadata,
            page: pageResult.page,
            title: pageResult.title,
            chunk: i,
          },
        })
      );
    });
  }

  return { documents, pageCount: pages.length };
}

export async function loadAndSplitPdf(filePath, metadata = {}) {
  const buffer = readFileSync(filePath);
  return loadAndSplitPdfBuffer(buffer, { source: filePath, ...metadata });
}
