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

// Reconstructs a document's full extracted text by paging through every
// point in its collection (Qdrant scroll), ordered the same way the source
// document was — used by study.js, which needs the whole document rather
// than a similarity-ranked subset.
export async function scrollAllChunks(collectionName) {
  const exists = await collectionExists(collectionName);
  if (!exists) return [];

  const client = getClient();
  const points = [];
  let offset;
  do {
    const res = await client.scroll(collectionName, {
      limit: 100,
      offset,
      with_payload: true,
      with_vector: false,
    });
    points.push(...res.points);
    offset = res.next_page_offset ?? undefined;
  } while (offset);

  return points
    .map((p) => ({
      content: p.payload?.content ?? "",
      page: p.payload?.metadata?.page,
      chunk: p.payload?.metadata?.chunk,
    }))
    .sort((a, b) => (a.page ?? 0) - (b.page ?? 0) || (a.chunk ?? 0) - (b.chunk ?? 0));
}

export async function deleteCollection(collectionName) {
  storeCache.delete(collectionName);
  const client = getClient();
  const { collections } = await client.getCollections();
  if (collections.some((c) => c.name === collectionName)) {
    await client.deleteCollection(collectionName);
  }
}
