import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();

vi.mock('./llm.js', () => ({
  getLLM: () => ({ invoke }),
}));
vi.mock('./vectorStore.js', () => ({
  scrollAllChunks: vi.fn(),
}));

const { scrollAllChunks } = await import('./vectorStore.js');
const { generateSummary, generateFlashcards } = await import('./study.js');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('generateSummary', () => {
  it('throws when the document has no ingested content yet', async () => {
    scrollAllChunks.mockResolvedValue([]);
    await expect(
      generateSummary({ collectionName: 'doc_1', documentTitle: 'Chapter 1' })
    ).rejects.toThrow('No processed content found for this document yet');
  });

  it('joins chunk content and returns the model response text', async () => {
    scrollAllChunks.mockResolvedValue([{ content: 'Part one.' }, { content: 'Part two.' }]);
    invoke.mockResolvedValue({ content: '## Summary\n- point one' });

    const summary = await generateSummary({ collectionName: 'doc_1', documentTitle: 'Chapter 1' });

    expect(summary).toBe('## Summary\n- point one');
    const promptSent = invoke.mock.calls[0][0][0].content;
    expect(promptSent).toContain('Part one.');
    expect(promptSent).toContain('Part two.');
    expect(promptSent).toContain('Chapter 1');
  });
});

describe('generateFlashcards', () => {
  it('throws when the document has no ingested content yet', async () => {
    scrollAllChunks.mockResolvedValue([]);
    await expect(generateFlashcards({ collectionName: 'doc_1', documentTitle: 'Chapter 1' })).rejects.toThrow(
      'No processed content found for this document yet'
    );
  });

  it('parses a clean JSON array response into flashcards', async () => {
    scrollAllChunks.mockResolvedValue([{ content: 'Mitochondria is the powerhouse of the cell.' }]);
    invoke.mockResolvedValue({
      content: '[{"question":"What is the powerhouse of the cell?","answer":"The mitochondria."}]',
    });

    const cards = await generateFlashcards({ collectionName: 'doc_1', documentTitle: 'Bio' });

    expect(cards).toEqual([
      { question: 'What is the powerhouse of the cell?', answer: 'The mitochondria.' },
    ]);
  });

  it('strips markdown code fences before parsing', async () => {
    scrollAllChunks.mockResolvedValue([{ content: 'Some content.' }]);
    invoke.mockResolvedValue({
      content: '```json\n[{"question":"Q?","answer":"A."}]\n```',
    });

    const cards = await generateFlashcards({ collectionName: 'doc_1', documentTitle: 'Bio' });

    expect(cards).toEqual([{ question: 'Q?', answer: 'A.' }]);
  });

  it('filters out malformed cards missing a question or answer', async () => {
    scrollAllChunks.mockResolvedValue([{ content: 'Some content.' }]);
    invoke.mockResolvedValue({
      content: JSON.stringify([
        { question: 'Complete?', answer: 'Yes.' },
        { question: '', answer: 'Missing question.' },
        { question: 'Missing answer.' },
      ]),
    });

    const cards = await generateFlashcards({ collectionName: 'doc_1', documentTitle: 'Bio' });

    expect(cards).toEqual([{ question: 'Complete?', answer: 'Yes.' }]);
  });

  it('throws when every returned card is malformed', async () => {
    scrollAllChunks.mockResolvedValue([{ content: 'Some content.' }]);
    invoke.mockResolvedValue({ content: '[{"question":"","answer":""}]' });

    await expect(generateFlashcards({ collectionName: 'doc_1', documentTitle: 'Bio' })).rejects.toThrow(
      'The model did not return any usable flashcards'
    );
  });
});
