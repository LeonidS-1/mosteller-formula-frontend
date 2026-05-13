/** Соответствует JSON препарата inv (сериализатор drug_json). */
export interface DrugJSON {
  drug_id: number;
  title: string;
  description: string;
  is_deleted: boolean;
  photo_url: string;
  video: string;
  adult_dose_mg: number;
  dose_per_m2_mg: number;
  max_daily_mg: number;
  /** Краткое описание на английском (50-100 символов) для CLIP-эмбеддингов. */
  short_description_en?: string;
}

/** Элемент каталога препаратов (как `drug_json` inv). */
export type DrugCatalogItem = DrugJSON;

/** Ответ `GET /api/prescriptions/cart`. */
export interface PrescriptionCartJSON {
  id?: number;
  has_draft: boolean;
  drugs_count: number;
}

/** Соответствует prescription_json inv. */
export interface PrescriptionJSON {
  prescription_id: number;
  status: string;
  created_at: string;
  creator_login: string;
  moderator_login?: string | null;
  forming_date?: string | null;
  finish_date?: string | null;
  doctor_full_name: string;
  completed_dose_line_count: number;
}

/** Строка м-м: рост, вес, доза (JSON dose). */
export interface PrescriptionDrugDetailJSON {
  prescription_id: number;
  drug_id: number;
  height_cm: number;
  weight_kg: number;
  dose: number | null;
  drug: DrugJSON;
}

export interface PrescriptionDetailResponse {
  prescription: PrescriptionJSON;
  lines: PrescriptionDrugDetailJSON[];
}

/** Критерий поиска как `query` в rip2026/templates/index.html. */
export interface DrugCatalogFilterCriteria {
  title: string;
}
