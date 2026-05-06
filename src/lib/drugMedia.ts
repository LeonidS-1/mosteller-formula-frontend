function minioBase(): string {
  const raw = import.meta.env.VITE_MINIO_BASE as string | undefined;
  return raw?.replace(/\/$/, "") ?? "";
}

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
  const base = minioBase();
  if (base) {
    return `${base}/${key.replace(/^\//, "")}`;
  }
  return fallbackImageUrl();
}
