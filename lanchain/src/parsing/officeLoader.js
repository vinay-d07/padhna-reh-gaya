import mammoth from "mammoth";
import JSZip from "jszip";
import { splitPages } from "./genericLoader.js";

// mammoth doesn't expose page boundaries, so a docx is treated as one page.
export async function loadAndSplitDocxBuffer(buffer, metadata = {}) {
  const { value: text } = await mammoth.extractRawText({ buffer });
  return splitPages([{ page: 1, text }], metadata);
}

const TEXT_RUN_RE = /<a:t>([\s\S]*?)<\/a:t>/g;

function unescapeXml(str) {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// A .pptx is a zip of per-slide XML; text runs live in <a:t> elements. This
// reads the archive in memory only (JSZip, no disk writes) rather than
// pulling in a full office-doc parsing library.
function extractSlideText(xml) {
  const matches = [...xml.matchAll(TEXT_RUN_RE)];
  return matches
    .map((m) => unescapeXml(m[1]))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function loadAndSplitPptxBuffer(buffer, metadata = {}) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml$/)[1]);
      const nb = Number(b.match(/slide(\d+)\.xml$/)[1]);
      return na - nb;
    });

  const pages = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async("string");
    pages.push({ page: i + 1, text: extractSlideText(xml) });
  }

  return splitPages(pages, metadata);
}
