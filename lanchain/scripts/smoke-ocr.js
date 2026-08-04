import { createCanvas } from "@napi-rs/canvas";
import { ocr, parseOCR, terminateOcrWorker } from "../src/parsing/utils.js";

const canvas = createCanvas(600, 400);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, 600, 400);
ctx.fillStyle = "#000000";
ctx.font = "28px sans-serif";
ctx.fillText("Scanned Slide Title", 40, 60);
ctx.font = "18px sans-serif";
ctx.fillText("This is a flattened slide image with no text layer.", 40, 120);
ctx.fillText("It should be routed through the OCR fallback path.", 40, 150);

const blocks = await ocr(canvas.toBuffer("image/png"));
console.log("blocks:", JSON.stringify(blocks, null, 2));
console.log("parsed:", JSON.stringify(parseOCR(blocks), null, 2));

await terminateOcrWorker();
