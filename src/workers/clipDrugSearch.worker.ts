/// <reference lib="webworker" />
import {
  env,
  AutoTokenizer,
  AutoProcessor,
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  RawImage,
} from "@huggingface/transformers";

env.allowLocalModels = false;
env.allowRemoteModels = true;

const MODEL_ID = "Xenova/clip-vit-base-patch32";
/** Размер эмбеддинга для clip-vit-base-patch32 (text/image projection). */
const EMBEDDING_SIZE = 512;

type ClipDrugItem = { drug_id: number; description_en: string };
type IncomingMessage =
  | { type: "init"; data: ClipDrugItem[] }
  | { type: "image"; data: Blob };

class ClipDrugService {
  static tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>> | null = null;
  static processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>> | null = null;
  static textModel:
    | Awaited<ReturnType<typeof CLIPTextModelWithProjection.from_pretrained>>
    | null = null;
  static visionModel:
    | Awaited<ReturnType<typeof CLIPVisionModelWithProjection.from_pretrained>>
    | null = null;

  static async init(progress_callback?: (data: unknown) => void) {
    if (this.tokenizer && this.processor && this.textModel && this.visionModel) {
      return;
    }
    const options = { device: "wasm", dtype: "q8" } as const;

    this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback });
    this.processor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback });
    this.textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, {
      ...options,
      progress_callback,
    });
    this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, {
      ...options,
      progress_callback,
    });
  }
}

self.addEventListener("message", async (event: MessageEvent<IncomingMessage>) => {
  const { type, data } = event.data;
  try {
    if (type === "init") {
      await ClipDrugService.init((msg) => {
        self.postMessage({ type: "progress", data: msg });
      });

      const drugs = data;
      const embeddings: Record<number, number[]> = {};
      if (drugs.length === 0) {
        self.postMessage({ type: "text_embeddings_ready", data: embeddings });
        return;
      }

      const descriptions = drugs.map((drug) => drug.description_en);
      const textInputs = await ClipDrugService.tokenizer!(descriptions, {
        padding: true,
        truncation: true,
      });

      const { text_embeds: textOutput } = await ClipDrugService.textModel!(textInputs);
      const flat = textOutput.data as Float32Array;

      for (let i = 0; i < drugs.length; i++) {
        const start = i * EMBEDDING_SIZE;
        const end = start + EMBEDDING_SIZE;
        const vector = flat.slice(start, end);
        embeddings[drugs[i].drug_id] = Array.from(vector);
      }

      self.postMessage({ type: "text_embeddings_ready", data: embeddings });
      return;
    }

    if (type === "image") {
      const imageUrl = URL.createObjectURL(data);
      try {
        const image = await RawImage.read(imageUrl);
        const imageInputs = await ClipDrugService.processor!(image);
        const { image_embeds } = await ClipDrugService.visionModel!(imageInputs);

        self.postMessage({
          type: "image_embedding_ready",
          data: Array.from(image_embeds.data as Float32Array),
        });
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: "error", data: message });
  }
});

export {};
