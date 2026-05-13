import axios from "axios";

export function apiErrMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data;
    if (d && typeof d === "object" && "description" in d) {
      return String((d as { description?: string }).description ?? "Ошибка запроса");
    }
    if (d && typeof d === "object") {
      const obj = d as Record<string, unknown>;
      const firstString = Object.values(obj).find((v) => typeof v === "string");
      if (typeof firstString === "string") return firstString;
    }
  }
  return "Ошибка запроса";
}
