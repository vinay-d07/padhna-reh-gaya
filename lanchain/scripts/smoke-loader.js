import { readFileSync } from "node:fs";
import { loadAndSplitPdfBuffer } from "../src/parsing/pdfLoader.js";
import { terminateOcrWorker } from "../src/parsing/utils.js";

const buf = readFileSync(process.argv[2]);
const { documents, pageCount } = await loadAndSplitPdfBuffer(buf, {
  source: process.argv[2],
  documentId: "doc_test123",
});

console.log("pageCount:", pageCount);
console.log("chunks:", documents.length);
for (const doc of documents) {
  console.log("---");
  console.log(JSON.stringify(doc.metadata));
  console.log(doc.pageContent.slice(0, 120));
}

await terminateOcrWorker();
