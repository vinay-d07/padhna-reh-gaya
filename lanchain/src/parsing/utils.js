import { createCanvas } from "@napi-rs/canvas";
import { createWorker } from "tesseract.js";
import { OCR_RENDER_SCALE } from "../config.js";

// Rasterizes a pdfjs page to a PNG buffer for OCR. Scale > 1 improves
// Tesseract accuracy on small slide text at the cost of render time.
export async function renderPage(page, scale = OCR_RENDER_SCALE) {
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");

  await page.render({ canvasContext: context, viewport }).promise;

  return canvas.toBuffer("image/png");
}

let workerPromise;

// Page segmentation mode 3 = fully automatic segmentation, no orientation/
// script detection — the bundled tesseract.js traineddata has no osd model.
function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng").then(async (worker) => {
      await worker.setParameters({ tessedit_pageseg_mode: "3" });
      return worker;
    });
  }
  return workerPromise;
}

// Runs OCR on a rendered page image and returns one string per detected
// text block (paragraph), in reading order.
export async function ocr(imageBuffer) {
  const worker = await getWorker();
  const { data } = await worker.recognize(imageBuffer);
  const blocks = data.blocks?.length ? data.blocks : data.paragraphs || [];
  return blocks.map((block) => block.text?.trim() || "").filter(Boolean);
}

export async function terminateOcrWorker() {
  if (!workerPromise) return;
  const worker = await workerPromise;
  workerPromise = undefined;
  await worker.terminate();
}

const AGILE_PRINCIPLES = [
  "Customer involvement",
  "Incremental delivery",
  "People not process",
  "Embrace change",
  "Maintain simplicity",
];

// Normalizes an OCR block list into the same shape parsePdfPages produces
// for text-layer pages: first block is the title, then either a known table
// (matched against the five agile principles) or a plain bullet list.
export function parseOCR(blocks) {
  const nonEmpty = blocks.map((b) => b.trim()).filter(Boolean);
  if (nonEmpty.length === 0) {
    return { title: "", type: "bullets", bullets: [] };
  }

  const [title, ...rest] = nonEmpty;

  const looksLikeTable = rest.length > 0 && /Principle/i.test(rest[0]) && /Description/i.test(rest[0]);

  if (looksLikeTable) {
    const rows = [];
    for (const principle of AGILE_PRINCIPLES) {
      const re = new RegExp(`${principle}[\\s:\u2013-]*([^\\n]*)`, "i");
      for (const block of rest) {
        const match = block.match(re);
        if (match) {
          rows.push({ principle, description: match[1].trim() });
          break;
        }
      }
    }
    return { title, type: "table", rows };
  }

  return { title, type: "bullets", bullets: rest };
}

// Groups a page's raw pdfjs TextItems into rows by Y-coordinate (items
// within 2pt of each other are treated as the same line), then reconstructs
// title + bulleted body: the tallest row is the title, a row starting with
// "•" opens a new bullet, any other row is a wrapped continuation of the
// previous bullet.
export function parseSlide(items) {
  const rows = [];
  for (const item of items) {
    const text = item.str?.trim();
    if (!text) continue;

    const x = item.transform[4];
    const y = item.transform[5];
    const height = item.height || Math.abs(item.transform[3]) || 0;

    let row = rows.find((r) => Math.abs(r.y - y) < 2);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push({ x, text, height });
  }

  // PDF space has y growing upward, so descending y is top-to-bottom.
  rows.sort((a, b) => b.y - a.y);
  rows.forEach((row) => row.items.sort((a, b) => a.x - b.x));

  const rowSummaries = rows
    .map((row) => ({
      text: row.items.map((i) => i.text).join(" ").trim(),
      maxHeight: Math.max(...row.items.map((i) => i.height)),
      minX: Math.min(...row.items.map((i) => i.x)),
    }))
    .filter((row) => row.text);

  if (rowSummaries.length === 0) {
    return { title: "", content: [] };
  }

  let titleIndex = 0;
  for (let i = 1; i < rowSummaries.length; i++) {
    if (rowSummaries[i].maxHeight > rowSummaries[titleIndex].maxHeight) {
      titleIndex = i;
    }
  }
  const title = rowSummaries[titleIndex].text;

  const content = [];
  let current = null;
  rowSummaries.forEach((row, i) => {
    if (i === titleIndex) return;

    if (row.text.startsWith("\u2022")) {
      current = { type: "bullet", level: 0, x: row.minX, text: row.text.replace(/^\u2022\s*/, "") };
      content.push(current);
    } else if (current) {
      current.text += ` ${row.text}`;
    } else {
      current = { type: "bullet", level: 0, x: row.minX, text: row.text };
      content.push(current);
    }
  });

  return { title, content };
}
