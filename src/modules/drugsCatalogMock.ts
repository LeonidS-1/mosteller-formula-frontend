import type { DrugCatalogFilterCriteria, DrugCatalogItem } from "./types";
import {
  drugCatalogItemMatchesSearch,
  splitDrugCatalogSearchTerms,
} from "./drugCatalogSearchTerms";

export const DRUGS_CATALOG_MOCK: DrugCatalogItem[] = [
  {
    drug_id: 1,
    title: "Парацетамол",
    description:
      "Жаропонижающее и обезболивающее. Рекомендован при лихорадке и боли лёгкой и средней интенсивности.",
    short_description_en:
      "White box with blue and purple design.",
    is_deleted: false,
    photo_url: "/mock/paracetamol.jpg",
    video: "/mock/paracetamol.mp4",
    adult_dose_mg: 1000,
    dose_per_m2_mg: 250,
    max_daily_mg: 4000,
  },
  {
    drug_id: 2,
    title: "Ибупрофен",
    description:
      "НПВП, жаропонижающее и противовоспалительное. Применяется при боли и воспалении.",
    short_description_en:
      "White box with green text and stripes.",
    is_deleted: false,
    photo_url: "/mock/ibuprofen.jpg",
    video: "/mock/ibuprofen.mp4",
    adult_dose_mg: 400,
    dose_per_m2_mg: 100,
    max_daily_mg: 2400,
  },
  {
    drug_id: 3,
    title: "Амоксициллин",
    description:
      "Антибиотик группы пенициллинов. Назначается при бактериальных инфекциях дыхательных путей и ЛОР-органов.",
    short_description_en:
      "White box with orange stripe and blue text.",
    is_deleted: false,
    photo_url: "",
    video: "",
    adult_dose_mg: 500,
    dose_per_m2_mg: 25,
    max_daily_mg: 1500,
  },
  {
    drug_id: 4,
    title: "Цетиризин",
    description:
      "Антигистаминный препарат. Показан при аллергическом рините и крапивнице.",
    short_description_en:
      "Green and white box with blue text.",
    is_deleted: false,
    photo_url: "",
    video: "/mock/cetirizine.mp4",
    adult_dose_mg: 10,
    dose_per_m2_mg: 5,
    max_daily_mg: 10,
  },
  {
    drug_id: 5,
    title: "Омепразол",
    description:
      "Ингибитор протонной помпы. Используется при ГЭРБ и язвенной болезни.",
    short_description_en:
      "White box with cyan and green stripes.",
    is_deleted: false,
    photo_url: "/mock/omeprazole.jpg",
    video: "/mock/omeprazole.mp4",
    adult_dose_mg: 20,
    dose_per_m2_mg: 10,
    max_daily_mg: 40,
  },
  {
    drug_id: 6,
    title: "Домперидон",
    description:
      "Противорвотное, прокинетик. При тошноте и функциональных нарушениях ЖКТ.",
    short_description_en:
      "White box with black/blue branding.",
    is_deleted: false,
    photo_url: "/mock/domperidone.jpg",
    video: "/mock/domperidone.mp4",
    adult_dose_mg: 10,
    dose_per_m2_mg: 2.5,
    max_daily_mg: 30,
  },
];

export function getMockDrugById(drugId: number): DrugCatalogItem | undefined {
  return DRUGS_CATALOG_MOCK.find((d) => d.drug_id === drugId);
}

export function filterDrugsCatalog(
  items: DrugCatalogItem[],
  c: DrugCatalogFilterCriteria,
): DrugCatalogItem[] {
  const terms = splitDrugCatalogSearchTerms(c.title);
  if (terms.length === 0) return [...items];
  return items.filter((item) => drugCatalogItemMatchesSearch(item, terms));
}

/** Локальный словарь EN-описаний по `drug_id`, чтобы CLIP-поиск работал
 * даже если бэкенд не возвращает поле `short_description_en`. */
export const DRUG_EN_DESCRIPTIONS: Record<number, string> = DRUGS_CATALOG_MOCK.reduce(
  (acc, drug) => {
    if (drug.short_description_en) {
      acc[drug.drug_id] = drug.short_description_en;
    }
    return acc;
  },
  {} as Record<number, string>,
);

/** Возвращает EN-описание для CLIP: из самой карточки, словаря или fallback по title. */
export function resolveDrugClipDescription(drug: DrugCatalogItem): string {
  if (drug.short_description_en && drug.short_description_en.trim()) {
    return drug.short_description_en.trim();
  }
  const fromDict = DRUG_EN_DESCRIPTIONS[drug.drug_id];
  if (fromDict) return fromDict;
  return `Pharmaceutical drug ${drug.title} for medical prescription and patient treatment.`;
}
