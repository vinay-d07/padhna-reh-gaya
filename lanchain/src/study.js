import { getLLM } from "./llm.js";
import { scrollAllChunks } from "./vectorStore.js";

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
  const cards = parseFlashcards(raw);
  if (cards.length === 0) {
    throw new Error("The model did not return any usable flashcards");
  }
  return cards;
}
