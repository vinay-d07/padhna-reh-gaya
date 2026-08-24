import { getLLM } from "./llm.js";
import { scrollAllChunks } from "./vectorStore.js";
import logger from "./logger.js";

// Rough char budget to keep the whole-document prompt within the model's
// context window without pulling in a tokenizer just for this.
const MAX_CONTEXT_CHARS = 18000;

async function getDocumentText(collectionName) {
  const chunks = await scrollAllChunks(collectionName);
  let text = "";
  for (const chunk of chunks) {
    if (text.length >= MAX_CONTEXT_CHARS) break;
    text += (text ? "\n\n" : "") + chunk.content;
  }
  return text.slice(0, MAX_CONTEXT_CHARS);
}

const SUMMARY_PROMPT = `You are an expert study assistant. Summarize the following document for a student studying it.

Write in Markdown:
- Start with a 2-3 sentence overview.
- Then a "## Key Points" section with 5-10 bullet points covering the most important ideas.
- Keep it grounded ONLY in the document text below — do not add outside knowledge.

Document: "{title}"

Content:
{content}`;

export async function generateSummary({ collectionName, documentTitle }) {
  const content = await getDocumentText(collectionName);
  if (!content) {
    throw new Error("No processed content found for this document yet");
  }

  const llm = getLLM();
  const response = await llm.invoke([
    {
      role: "user",
      content: SUMMARY_PROMPT.replace("{title}", documentTitle || "Untitled").replace(
        "{content}",
        content
      ),
    },
  ]);

  return typeof response.content === "string" ? response.content : String(response.content);
}

const FLASHCARDS_PROMPT = `You are an expert study assistant. Generate exactly {count} flashcards (question + answer pairs) from the document content below, covering its most important, testable facts and concepts.

Rules:
- Base every card ONLY on the document text — no outside knowledge.
- Questions should be specific and answerable from the text.
- Answers should be concise (1-3 sentences).
- Respond with ONLY a JSON array, no prose, no markdown fences, in this exact shape:
[{"question": "...", "answer": "..."}, ...]

Document: "{title}"

Content:
{content}`;

function parseFlashcards(raw) {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  const jsonText = jsonMatch ? jsonMatch[0] : cleaned;
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected a JSON array of flashcards");
  }
  return parsed
    .map((card) => ({
      question: String(card?.question || "").trim(),
      answer: String(card?.answer || "").trim(),
    }))
    .filter((card) => card.question && card.answer);
}

export async function generateFlashcards({ collectionName, documentTitle, count = 10 }) {
  const content = await getDocumentText(collectionName);
  if (!content) {
    throw new Error("No processed content found for this document yet");
  }

  const llm = getLLM();
  const response = await llm.invoke([
    {
      role: "user",
      content: FLASHCARDS_PROMPT.replace("{count}", String(count))
        .replace("{title}", documentTitle || "Untitled")
        .replace("{content}", content),
    },
  ]);

  const raw = typeof response.content === "string" ? response.content : String(response.content);

  let cards;
  try {
    cards = parseFlashcards(raw);
  } catch (error) {
    logger.error({ collectionName, err: error }, "failed to parse flashcards JSON from model output");
    throw error;
  }

  if (cards.length === 0) {
    throw new Error("The model did not return any usable flashcards");
  }
  return cards;
}

const QUIZ_PROMPT = `You are an expert study assistant. Generate exactly {count} multiple-choice quiz questions from the document content below, covering its most important, testable facts and concepts.

Rules:
- Base every question ONLY on the document text — no outside knowledge.
- Each question must have exactly 4 options, with exactly one correct.
- correctIndex is the 0-based index of the correct option.
- explanation is a 1-2 sentence explanation of why the correct answer is right, grounded in the document.
- Respond with ONLY a JSON array, no prose, no markdown fences, in this exact shape:
[{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "..."}, ...]

Document: "{title}"

Content:
{content}`;

function parseQuiz(raw) {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  const jsonText = jsonMatch ? jsonMatch[0] : cleaned;
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected a JSON array of quiz questions");
  }
  return parsed
    .map((q) => ({
      question: String(q?.question || "").trim(),
      options: Array.isArray(q?.options) ? q.options.map((o) => String(o).trim()) : [],
      correctIndex: Number.isInteger(q?.correctIndex) ? q.correctIndex : -1,
      explanation: String(q?.explanation || "").trim(),
    }))
    .filter(
      (q) =>
        q.question &&
        q.options.length === 4 &&
        q.options.every(Boolean) &&
        q.correctIndex >= 0 &&
        q.correctIndex < 4
    );
}

export async function generateQuiz({ collectionName, documentTitle, count = 5 }) {
  const content = await getDocumentText(collectionName);
  if (!content) {
    throw new Error("No processed content found for this document yet");
  }

  const llm = getLLM();
  const response = await llm.invoke([
    {
      role: "user",
      content: QUIZ_PROMPT.replace("{count}", String(count))
        .replace("{title}", documentTitle || "Untitled")
        .replace("{content}", content),
    },
  ]);

  const raw = typeof response.content === "string" ? response.content : String(response.content);

  let questions;
  try {
    questions = parseQuiz(raw);
  } catch (error) {
    logger.error({ collectionName, err: error }, "failed to parse quiz JSON from model output");
    throw error;
  }

  if (questions.length === 0) {
    throw new Error("The model did not return any usable quiz questions");
  }
  return questions;
}
