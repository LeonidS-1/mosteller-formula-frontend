import { TARGET_CONFIG } from "../target_config";

export function fallbackImageUrl(): string {
  return "/mock/drug-pill-placeholder.svg";
}

export function resolveDrugMediaUrl(key: string): string {
  if (!key?.trim()) return fallbackImageUrl();
  if (
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/") ||
    key.startsWith("blob:") ||
    key.startsWith("data:")
  ) {
    return key;
  }
  const base = TARGET_CONFIG.mediaBaseUrl.replace(/\/$/, "");
  if (base) {
    return `${base}/${key.replace(/^\//, "")}`;
  }
  return fallbackImageUrl();
}
