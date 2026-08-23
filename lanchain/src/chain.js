import { getLLM } from "./llm.js";
import { PER_COLLECTION_K, RETRIEVAL_K } from "./config.js";
import { getVectorStore } from "./vectorStore.js";
import logger from "./logger.js";

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions about the user's uploaded PDF documents.

Answer ONLY using the context blocks below. If the answer is not contained in the context, say plainly that you don't know based on the uploaded documents — do not use outside knowledge or guess.
do not just list the context, explain it by taking context as a refrence
When you use a piece of context, cite it inline with its bracketed number, e.g. [1], matching the numbered blocks below. If multiple documents are relevant, cite each one you rely on.

Format every response as Markdown, and pick the structure to fit the answer:
- '## '/'### ' headings when the answer has multiple sections
- '-'/'1.' lists for enumerations, steps, or multiple items
- '**bold**' for key terms, '\`inline code\`' for identifiers/values, fenced \`\`\` code blocks for code or config
- tables (Markdown table syntax) when the context contains tabular data
- short prose paragraphs for a single direct answer — don't force structure that isn't there

Context:
{context}`;

// Queries every document's Qdrant collection in parallel, then merges and
// re-ranks the combined hits so a workspace-wide question draws from
// whichever documents actually contain the relevant passage.
async function retrieveContext(question, collectionNames) {
  const perCollection = await Promise.all(
    collectionNames.map(async (collectionName) => {
      try {
        const store = getVectorStore(collectionName);
        const results = await store.similaritySearchWithScore(question, PER_COLLECTION_K);
        return results.map(([doc, score]) => ({ doc, score }));
      } catch (error) {
        // Collection may not exist yet (document still processing) — skip it
        // rather than failing the whole answer.
        logger.debug({ collectionName, err: error }, "skipping collection in retrieval");
        return [];
      }
    })
  );

  return perCollection
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, RETRIEVAL_K);
}

function formatSource(doc, index) {
  const page = doc.metadata?.page != null ? `page ${doc.metadata.page}` : "unknown page";
  const label = doc.metadata?.documentTitle || doc.metadata?.title || "document";
  return `[${index + 1}] (${label}, ${page})\n${doc.pageContent}`;
}

function buildHistoryMessages(chatHistory) {
  return chatHistory
    .slice(-8)
    .filter((m) => m?.content)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
}

// Retrieves context across `collectionNames`, streams the LLM's answer token
// by token via `onToken`, and returns the full answer plus the sources it
// was grounded in.
export async function streamAnswer({ question, collectionNames, chatHistory = [], onToken }) {
  const ranked = collectionNames.length ? await retrieveContext(question, collectionNames) : [];

  const contextBlock = ranked.length
    ? ranked.map(({ doc }, i) => formatSource(doc, i)).join("\n\n")
    : "No relevant context was found in the uploaded documents.";

  const messages = [
    { role: "system", content: SYSTEM_PROMPT.replace("{context}", contextBlock) },
    ...buildHistoryMessages(chatHistory),
    { role: "user", content: question },
  ];

  const llm = getLLM();
  const stream = await llm.stream(messages);

  let answer = "";
  for await (const chunk of stream) {
    const token = typeof chunk.content === "string" ? chunk.content : "";
    if (!token) continue;
    answer += token;
    onToken?.(token);
  }

  const sources = ranked.map(({ doc, score }) => ({
    documentId: doc.metadata?.documentId,
    documentTitle: doc.metadata?.documentTitle,
    page: doc.metadata?.page,
    title: doc.metadata?.title,
    score,
  }));

  return { answer, sources };
}
