import { llm, EMBEDDING_MODEL } from "./llm";

export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  try {
    const response = await llm.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findSimilarIdeas(
  targetEmbedding: number[],
  allIdeas: { id: string; title: string; embedding: string | null }[],
  excludeId: string,
  topK: number = 5
): { id: string; title: string; similarity: number }[] {
  const results: { id: string; title: string; similarity: number }[] = [];

  for (const idea of allIdeas) {
    if (idea.id === excludeId || !idea.embedding) continue;
    try {
      const embedding = JSON.parse(idea.embedding) as number[];
      const similarity = cosineSimilarity(targetEmbedding, embedding);
      results.push({ id: idea.id, title: idea.title, similarity });
    } catch {
      continue;
    }
  }

  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter((r) => r.similarity > 0.3);
}
