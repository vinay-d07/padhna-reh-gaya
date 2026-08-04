import { readFileSync } from "node:fs";
import { parsePdfPages } from "../src/parsing/pdfParser.js";
import { terminateOcrWorker } from "../src/parsing/utils.js";

const path = process.argv[2];
const buf = readFileSync(path);
const pages = await parsePdfPages(buf);
console.log(JSON.stringify(pages, null, 2));

await terminateOcrWorker();
