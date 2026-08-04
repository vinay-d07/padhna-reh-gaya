import { ChatGroq } from "@langchain/groq";
import { GROQ_API_KEY, GROQ_MODEL } from "./config.js";

let llmInstance;

export function getLLM() {
  if (!llmInstance) {
    llmInstance = new ChatGroq({
      apiKey: GROQ_API_KEY(),
      model: GROQ_MODEL,
      temperature: 0.2,
      streaming: true,
    });
  }
  return llmInstance;
}
