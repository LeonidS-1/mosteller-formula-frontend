import type { DrugCatalogFilterCriteria } from "./types";

export type ParseDrugCatalogFilterResult =
  | { ok: true; criteria: DrugCatalogFilterCriteria }
  | { ok: false; reason: string };

/**
 * Извлекает `{title: string}` из ответа WebLLM. Модель может изредка
 * обернуть JSON в ```json ... ``` или приписать пояснение — отсюда
 * regex по фигурным скобкам, потом строгая проверка типа.
 */
export function parseDrugCatalogFilterFromLlm(
  raw: string,
): ParseDrugCatalogFilterResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: "Пустой ответ модели" };
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    return { ok: false, reason: "В ответе не найден JSON-объект" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return { ok: false, reason: "Не удалось разобрать JSON" };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "Ответ не является объектом" };
  }

  const title = (parsed as { title?: unknown }).title;
  if (typeof title !== "string") {
    return { ok: false, reason: "Поле title отсутствует или не строка" };
  }

  return { ok: true, criteria: { title: title.trim() } };
}
