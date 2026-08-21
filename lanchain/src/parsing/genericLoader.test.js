import { describe, it, expect } from 'vitest';
import { splitPages } from './genericLoader.js';

describe('splitPages', () => {
  it('skips pages with no extractable text', async () => {
    const { documents, pageCount } = await splitPages([
      { page: 1, text: '   ' },
      { page: 2, text: '' },
    ]);

    expect(documents).toHaveLength(0);
    expect(pageCount).toBe(2);
  });

  it('produces one chunk per short page, tagged with page/chunk metadata', async () => {
    const { documents, pageCount } = await splitPages(
      [
        { page: 1, text: 'Hello world.' },
        { page: 2, text: 'Second page content.' },
      ],
      { documentId: 'doc_1' }
    );

    expect(pageCount).toBe(2);
    expect(documents).toHaveLength(2);
    expect(documents[0].pageContent).toBe('Hello world.');
    expect(documents[0].metadata).toEqual({ documentId: 'doc_1', page: 1, chunk: 0 });
    expect(documents[1].metadata).toEqual({ documentId: 'doc_1', page: 2, chunk: 0 });
  });

  it('splits long text on a single page into multiple ordered chunks', async () => {
    const longText = Array.from({ length: 200 }, (_, i) => `Sentence number ${i}.`).join(' ');

    const { documents } = await splitPages([{ page: 1, text: longText }]);

    expect(documents.length).toBeGreaterThan(1);
    documents.forEach((doc, i) => {
      expect(doc.metadata.page).toBe(1);
      expect(doc.metadata.chunk).toBe(i);
    });
  });
});
