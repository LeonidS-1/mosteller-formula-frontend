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
const EMBEDDING_SIZE = 512;

type ClipDrugItem = {
  drug_id: number;
  description_en: string;
  photo_url: string;
};
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

  static async computeImageEmbedding(url: string): Promise<number[] | null> {
    try {
      const image = await RawImage.read(url);
      const imageInputs = await this.processor!(image);
      const { image_embeds } = await this.visionModel!(imageInputs);
      return Array.from(image_embeds.data as Float32Array);
    } catch {
      return null;
    }
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
      const result: Record<number, { text?: number[]; image?: number[] }> = {};

      if (drugs.length === 0) {
        self.postMessage({ type: "embeddings_ready", data: result });
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
        result[drugs[i].drug_id] = { text: Array.from(vector) };
      }

      for (const drug of drugs) {
        if (!drug.photo_url?.trim()) continue;
        const imgEmb = await ClipDrugService.computeImageEmbedding(drug.photo_url);
        if (imgEmb) {
          if (!result[drug.drug_id]) result[drug.drug_id] = {};
          result[drug.drug_id].image = imgEmb;
        }
      }

      self.postMessage({ type: "embeddings_ready", data: result });
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
