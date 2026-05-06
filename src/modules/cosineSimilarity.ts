/** Косинусное сходство двух векторов одинаковой длины. */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Нормированный score в [0, 1]: подходит под пороги задания (0.4–0.9). */
export function normalizedSimilarityScore(vecA: number[], vecB: number[]): number {
  const cos = cosineSimilarity(vecA, vecB);
  const score = (cos + 1) / 2;
  if (score < 0) return 0;
  if (score > 1) return 1;
  return score;
}
