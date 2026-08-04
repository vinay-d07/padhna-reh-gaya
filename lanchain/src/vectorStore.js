import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_API_KEY, QDRANT_URL } from "./config.js";
import { getEmbeddings } from "./embeddings.js";

let clientInstance;

function getClient() {
  if (!clientInstance) {
    clientInstance = new QdrantClient({ url: QDRANT_URL(), apiKey: QDRANT_API_KEY() });
  }
  return clientInstance;
}

const storeCache = new Map();

// Each ingested document gets its own Qdrant collection, named after its
// vectorNamespace. QdrantVectorStore creates the collection automatically
// (right vector size, detected from the embedding model) the first time
// addDocuments()/similaritySearch() touches it.
export function getVectorStore(collectionName) {
  if (!storeCache.has(collectionName)) {
    storeCache.set(
      collectionName,
      new QdrantVectorStore(getEmbeddings(), {
        client: getClient(),
        collectionName,
      })
    );
  }
  return storeCache.get(collectionName);
}

export async function collectionExists(collectionName) {
  const client = getClient();
  const { collections } = await client.getCollections();
  return collections.some((c) => c.name === collectionName);
}

export async function deleteCollection(collectionName) {
  storeCache.delete(collectionName);
  const client = getClient();
  const { collections } = await client.getCollections();
  if (collections.some((c) => c.name === collectionName)) {
    await client.deleteCollection(collectionName);
  }
}
