import type {
  DrugCatalogFilterCriteria,
  DrugCatalogItem,
  PrescriptionCartResponse,
} from "./types";
import {
  DRUGS_CATALOG_MOCK,
  filterDrugsCatalog,
  getMockDrugById,
} from "./drugsCatalogMock";

const API_BASE = "/api";

const SAFE_CART_FALLBACK: PrescriptionCartResponse = {
  has_draft: false,
  drugs_count: 0,
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** GET /api/drugs?Title=... — список услуг с фильтром по названию. */
export async function listDrugs(
  criteria?: Partial<DrugCatalogFilterCriteria>,
): Promise<DrugCatalogItem[]> {
  const title = criteria?.title?.trim() ?? "";
  const url = title
    ? `${API_BASE}/drugs?Title=${encodeURIComponent(title)}`
    : `${API_BASE}/drugs`;

  const data = await fetchJson<DrugCatalogItem[]>(url);
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }
  return filterDrugsCatalog(DRUGS_CATALOG_MOCK, { title });
}

/** GET /api/drugs/:id — одна карточка услуги. */
export async function getDrug(drugId: number): Promise<DrugCatalogItem | null> {
  const url = `${API_BASE}/drugs/${drugId}`;
  const data = await fetchJson<DrugCatalogItem>(url);
  if (data && typeof data.drug_id === "number") {
    return data;
  }
  return getMockDrugById(drugId) ?? null;
}

/** GET /api/prescriptions/cart — иконка корзины (без авторизации, ответ всегда 200). */
export async function getPrescriptionCart(): Promise<PrescriptionCartResponse> {
  const url = `${API_BASE}/prescriptions/cart`;
  const data = await fetchJson<PrescriptionCartResponse>(url);
  if (data && typeof data.has_draft === "boolean") {
    return {
      id: data.id,
      has_draft: data.has_draft,
      drugs_count: data.drugs_count ?? 0,
    };
  }
  return { ...SAFE_CART_FALLBACK };
}
