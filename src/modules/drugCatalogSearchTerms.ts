import type { DrugCatalogItem } from "./types";

/** Части запроса через запятую (как от LLM или ручного ввода). */
export function splitDrugCatalogSearchTerms(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

/** Совпадение по title или description; несколько терминов — логика ИЛИ. */
export function drugCatalogItemMatchesSearch(
  item: DrugCatalogItem,
  terms: string[],
): boolean {
  if (terms.length === 0) return true;
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}
