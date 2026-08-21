import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { loadAndSplitDocxBuffer, loadAndSplitPptxBuffer } from './officeLoader.js';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(async () => ({ value: 'Extracted docx text.' })),
  },
}));

function slideXml(text) {
  return `<?xml version="1.0"?><p:sld xmlns:a="a"><a:t>${text}</a:t></p:sld>`;
}

async function buildPptxBuffer(slideTexts) {
  const zip = new JSZip();
  slideTexts.forEach((text, i) => {
    zip.file(`ppt/slides/slide${i + 1}.xml`, slideXml(text));
  });
  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('loadAndSplitDocxBuffer', () => {
  it('treats the whole docx as a single page (mammoth has no page boundaries)', async () => {
    const { documents, pageCount } = await loadAndSplitDocxBuffer(Buffer.from('irrelevant'));

    expect(pageCount).toBe(1);
    expect(documents).toHaveLength(1);
    expect(documents[0].pageContent).toBe('Extracted docx text.');
    expect(documents[0].metadata.page).toBe(1);
  });
});

describe('loadAndSplitPptxBuffer', () => {
  it('extracts one page per slide, in numeric slide order', async () => {
    const buffer = await buildPptxBuffer(['First slide', 'Second slide', 'Third slide']);

    const { documents, pageCount } = await loadAndSplitPptxBuffer(buffer);

    expect(pageCount).toBe(3);
    expect(documents.map((d) => d.pageContent)).toEqual(['First slide', 'Second slide', 'Third slide']);
    expect(documents.map((d) => d.metadata.page)).toEqual([1, 2, 3]);
  });

  it('sorts slides numerically, not lexicographically (slide2 before slide10)', async () => {
    const zip = new JSZip();
    zip.file('ppt/slides/slide10.xml', slideXml('Tenth'));
    zip.file('ppt/slides/slide2.xml', slideXml('Second'));
    zip.file('ppt/slides/slide1.xml', slideXml('First'));
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    const { documents } = await loadAndSplitPptxBuffer(buffer);

    expect(documents.map((d) => d.pageContent)).toEqual(['First', 'Second', 'Tenth']);
  });

  it('unescapes XML entities and collapses whitespace across multiple text runs', async () => {
    const zip = new JSZip();
    zip.file(
      'ppt/slides/slide1.xml',
      '<p:sld><a:t>Tom &amp; Jerry</a:t><a:t>  say &quot;hi&quot;</a:t></p:sld>'
    );
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    const { documents } = await loadAndSplitPptxBuffer(buffer);

    expect(documents[0].pageContent).toBe('Tom & Jerry say "hi"');
  });

  it('produces an empty page (skipped by the splitter) for a slide with no text runs', async () => {
    const buffer = await buildPptxBuffer(['']);

    const { documents, pageCount } = await loadAndSplitPptxBuffer(buffer);

    expect(pageCount).toBe(1);
    expect(documents).toHaveLength(0);
  });
});
