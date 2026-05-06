import { useEffect, useMemo, useRef, useState } from "react";
import { normalizedSimilarityScore } from "../modules/cosineSimilarity";

export interface ClipDrugItem {
  drug_id: number;
  description_en: string;
}

export interface ProcessedClipDrugItem extends ClipDrugItem {
  score: number;
  isVisible: boolean;
  embedding?: number[];
}

/** Порог из диапазона задания (0.4–0.9) для нормированного score = (cos+1)/2. */
export const CLIP_SIMILARITY_THRESHOLD = 0.55;
export const CLIP_TOP_K = 5;

function normalizeProgress(raw: unknown): number | null {
  if (raw === null || typeof raw !== "object") return null;
  const o = raw as { status?: string; progress?: number };
  if (typeof o.progress !== "number") return null;
  const p = o.progress;
  if (p <= 1 && p >= 0) return Math.round(p * 100);
  return Math.min(100, Math.round(p));
}

export function useDrugImageSearch(initialItems: ClipDrugItem[], enabled: boolean) {
  const [items, setItems] = useState<ProcessedClipDrugItem[]>([]);
  const [imageEmbedding, setImageEmbedding] = useState<number[] | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workerError, setWorkerError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const embeddingsReadyRef = useRef(false);
  const pendingFileRef = useRef<File | null>(null);
  const lastUploadedImageNameRef = useRef<string | null>(null);

  const itemsKey = useMemo(
    () => initialItems.map((item) => `${item.drug_id}:${item.description_en}`).join("|"),
    [initialItems],
  );

  useEffect(() => {
    embeddingsReadyRef.current = false;
    pendingFileRef.current = null;

    if (!enabled) {
      workerRef.current?.terminate();
      workerRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      setReady(false);
      setProgress(0);
      setImageEmbedding(null);
      setWorkerError(null);
      return;
    }

    if (initialItems.length === 0) {
       
      setItems([]);
      setReady(true);
      setProgress(100);
      setImageEmbedding(null);
      setWorkerError(null);
      return;
    }

     
    setItems(initialItems.map((item) => ({ ...item, score: 0, isVisible: true })));
    setReady(false);
    setProgress(0);
    setImageEmbedding(null);
    setWorkerError(null);

    const worker = new Worker(
      new URL("../workers/clipDrugSearch.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { type, data } = e.data as { type: string; data: unknown };

      switch (type) {
        case "progress": {
          const msg = data as { status?: string; progress?: number };
          if (msg?.status === "ready") {
            setReady(true);
          } else {
            const p = normalizeProgress(data);
            if (p !== null) setProgress(p);
          }
          break;
        }
        case "text_embeddings_ready": {
          embeddingsReadyRef.current = true;
          const dict = data as Record<number, number[] | undefined>;
          setItems((prev) =>
            prev.map((item) => ({ ...item, embedding: dict[item.drug_id] })),
          );
          setReady(true);
          setProgress(100);
          const pending = pendingFileRef.current;
          if (pending && workerRef.current) {
            pendingFileRef.current = null;
            workerRef.current.postMessage({ type: "image", data: pending });
          }
          break;
        }
        case "image_embedding_ready":
          setImageEmbedding(data as number[]);
          break;
        case "error":
          setWorkerError(typeof data === "string" ? data : "Ошибка CLIP-воркера");
          setReady(true);
          pendingFileRef.current = null;
          break;
        default:
          break;
      }
    };

    worker.postMessage({ type: "init", data: initialItems });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, enabled]);

  useEffect(() => {
    if (!imageEmbedding) return;

    setItems((prevItems) => {
      if (prevItems.length === 0 || !prevItems.some((it) => it.embedding)) {
        return prevItems;
      }

      const processed = prevItems.map((item) => {
        if (!item.embedding) return { ...item, score: 0, isVisible: false };
        const score = normalizedSimilarityScore(imageEmbedding, item.embedding);
        return { ...item, score, isVisible: false };
      });

      processed.sort((a, b) => b.score - a.score);

      let visibleCount = 0;
      for (const item of processed) {
        if (visibleCount >= CLIP_TOP_K) break;
        if (item.score >= CLIP_SIMILARITY_THRESHOLD) {
          item.isVisible = true;
          visibleCount += 1;
        }
      }

      if (visibleCount === 0) {
        for (const item of processed.slice(0, CLIP_TOP_K)) {
          item.isVisible = true;
        }
      }

      const uploadedImageName = lastUploadedImageNameRef.current ?? "unknown image";
      console.groupCollapsed(`[CLIP drug search] ${uploadedImageName}`);
      console.info(
        "Порог сходства:",
        CLIP_SIMILARITY_THRESHOLD,
        "| TopK:",
        CLIP_TOP_K,
      );
      console.table(
        processed.map((item) => ({
          drug_id: item.drug_id,
          description_en: item.description_en,
          score: Number(item.score.toFixed(4)),
          visible: item.isVisible,
        })),
      );
      console.groupEnd();

      return processed;
    });
  }, [imageEmbedding]);

  function searchByImage(file: File) {
    lastUploadedImageNameRef.current = file.name || "uploaded image";
    if (!workerRef.current || !embeddingsReadyRef.current) {
      pendingFileRef.current = file;
      return;
    }
    workerRef.current.postMessage({ type: "image", data: file });
  }

  function resetSearch() {
    setImageEmbedding(null);
    setWorkerError(null);
    pendingFileRef.current = null;
    setItems((prev) => {
      const sortedById = [...prev].sort((a, b) => a.drug_id - b.drug_id);
      return sortedById.map((item) => ({ ...item, score: 0, isVisible: true }));
    });
  }

  return {
    items,
    ready,
    progress,
    imageEmbedding,
    workerError,
    searchByImage,
    resetSearch,
  };
}
