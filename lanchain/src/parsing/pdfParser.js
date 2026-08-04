import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { OCR_MIN_TEXT_ITEMS, OCR_MIN_TEXT_LENGTH } from "../config.js";
import { renderPage, ocr, parseOCR, parseSlide } from "./utils.js";

// pdfjs-dist ships ESM-only; resolve its worker through require() so the
// legacy Node build doesn't fall back to the (noisier, main-thread) fake
// worker path. The resolved path must be a file:// URL string on Windows —
// pdfjs passes it straight to dynamic import().
const require = createRequire(import.meta.url);
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
).href;

// CJK glyph maps ship with pdfjs-dist and cover encodings the text-content
// extraction relies on; the bundled "standard_fonts" directory doesn't match
// pdfjs's expected file names for non-embedded Latin fonts, so that one is
// deliberately left unset (harmless — falls back to metric-only glyphs,
// which doesn't affect getTextContent()).
const cMapUrl = `${pathToFileURL(require.resolve("pdfjs-dist/package.json")).href.replace(
  /package\.json$/,
  "cmaps/"
)}`;

// Parses a PDF buffer page by page into a normalized structure. Each page is
// either read from its real text layer, or — when the page looks like a
// flattened image (few/no extractable text items) — rasterized and OCR'd.
//
// Output per page is one of:
//   { page, title, type: "table",   rows:    [{ principle, description }] }
//   { page, title, type: "bullets", bullets: [string] }
//   { page, title, content: [{ type: "bullet", level, x, text }] }
export async function parsePdfPages(buffer) {
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl,
    cMapPacked: true,
  }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const extractedText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    const useOCR =
      content.items.length < OCR_MIN_TEXT_ITEMS || extractedText.length < OCR_MIN_TEXT_LENGTH;

    let result;
    if (useOCR) {
      const image = await renderPage(page);
      const blocks = await ocr(image);
      result = parseOCR(blocks);
    } else {
      result = parseSlide(content.items);
    }

    pages.push({ page: pageNumber, ...result });
    page.cleanup();
  }

  await pdf.destroy();
  return pages;
}
