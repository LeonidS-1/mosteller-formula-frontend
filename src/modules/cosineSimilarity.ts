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

/**
 * Softmax-нормализация косинусных сходств с температурным масштабом CLIP.
 *
 * CLIP обучается с learnable logit_scale (≈100 у clip-vit-base-patch32).
 * Softmax экспоненциально усиливает малые разницы в cosine-сходствах,
 * давая осмысленное ранжирование вместо «всё ~62%».
 */
const DEFAULT_LOGIT_SCALE = 50;

export function clipSoftmaxScores(
  imageVec: number[],
  textVecs: (number[] | undefined)[],
  logitScale: number = DEFAULT_LOGIT_SCALE,
): number[] {
  if (textVecs.length === 0) return [];

  const cosines = textVecs.map((tv) =>
    tv ? cosineSimilarity(imageVec, tv) : -Infinity,
  );

  const finite = cosines.filter((c) => isFinite(c));
  if (finite.length === 0) return cosines.map(() => 0);

  const logits = cosines.map((c) => (isFinite(c) ? c * logitScale : -Infinity));
  const maxLogit = Math.max(...finite) * logitScale;
  const exps = logits.map((l) => (isFinite(l) ? Math.exp(l - maxLogit) : 0));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => (sum > 0 ? e / sum : 0));
}
