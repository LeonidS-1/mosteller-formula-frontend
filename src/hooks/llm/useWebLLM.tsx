import { useEffect, useState } from "react";
import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";
import type { InitProgressReport } from "@mlc-ai/web-llm";

/**
 * Хук инициализации WebLLM для подсказчика поиска препаратов.
 * Модель по умолчанию — Hermes-3-Llama-3.1-8B-Instruct (q4f16),
 * запускается прямо в браузере на WebGPU.
 */
const useWebLLM = (model: string = "Hermes-3-Llama-3.1-8B-q4f16_1-MLC") => {
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const initEngine = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const engineInstance = await CreateMLCEngine(model, {
          initProgressCallback: (report: InitProgressReport) => {
            if (!cancelled) setProgress(report.progress);
          },
        });

        if (!cancelled) setEngine(engineInstance);
      } catch (err) {
        console.error("Ошибка инициализации модели:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          const unknownModel =
            msg.includes("Cannot find model record") ||
            msg.includes("model_list");
          setError(
            unknownModel
              ? `Модель «${model}» не найдена в WebLLM. Проверьте model_id (например Hermes-3-Llama-3.1-8B-q4f16_1-MLC).`
              : "Не удалось загрузить модель. Проверьте WebGPU (Chrome, Яндекс, Arc) и сеть для скачивания весов.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void initEngine();

    return () => {
      cancelled = true;
    };
  }, [model]);

  return { engine, progress, error, isLoading };
};

export default useWebLLM;
