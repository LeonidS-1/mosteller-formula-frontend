import axios from "axios";
import type {
  DrugCatalogFilterCriteria,
  DrugCatalogItem,
} from "./types";
import {
  DRUGS_CATALOG_MOCK,
  filterDrugsCatalog,
  getMockDrugById,
} from "./drugsCatalogMock";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** Axios для каталога препаратов (услуги). По заданию: только axios, без codegen и без thunk. */
export const drugsAxios = axios.create({
  baseURL,
});

drugsAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function listDrugs(
  criteria?: Partial<DrugCatalogFilterCriteria>,
): Promise<DrugCatalogItem[]> {
  const title = criteria?.title?.trim() ?? "";
  try {
    const r = await drugsAxios.get<DrugCatalogItem[]>("/drugs", {
      params: title ? { Title: title } : undefined,
      headers: { Accept: "application/json" },
    });
    if (Array.isArray(r.data) && r.data.length > 0) {
      return r.data;
    }
  } catch {
    // fallthrough в мок-каталог
  }
  return filterDrugsCatalog(DRUGS_CATALOG_MOCK, { title });
}

/** GET /api/drugs/:id — карточка одной услуги. */
export async function getDrug(drugId: number): Promise<DrugCatalogItem | null> {
  try {
    const r = await drugsAxios.get<DrugCatalogItem>(`/drugs/${drugId}`, {
      headers: { Accept: "application/json" },
    });
    if (r.data && typeof r.data.drug_id === "number") {
      return r.data;
    }
  } catch {
    // fallthrough в мок
  }
  return getMockDrugById(drugId) ?? null;
}
