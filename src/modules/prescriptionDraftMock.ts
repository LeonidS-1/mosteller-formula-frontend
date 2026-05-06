import type { PrescriptionDetailResponse } from "./types";
import { calculatePediatricDoseMg } from "../lib/pediatricDose";
import { DRUGS_CATALOG_MOCK } from "./drugsCatalogMock";

/** Демо-ID черновика рецепта для маршрута `/prescriptions/:prescriptionId` (статический mock). */
export const PRESCRIPTION_DEMO_ID = 1;

const paracetamol = DRUGS_CATALOG_MOCK.find((d) => d.drug_id === 1)!;
const ibuprofen = DRUGS_CATALOG_MOCK.find((d) => d.drug_id === 2)!;

export const MOCK_PRESCRIPTION_DETAIL: PrescriptionDetailResponse = {
  prescription: {
    prescription_id: PRESCRIPTION_DEMO_ID,
    status: "draft",
    created_at: new Date("2025-04-01T10:00:00.000Z").toISOString(),
    creator_login: "guest_demo",
    moderator_login: null,
    forming_date: null,
    finish_date: null,
    doctor_full_name: "Смирнова Анна Владимировна",
    completed_dose_line_count: 2,
  },
  lines: [
    {
      prescription_id: PRESCRIPTION_DEMO_ID,
      drug_id: paracetamol.drug_id,
      height_cm: 120,
      weight_kg: 25,
      dose: calculatePediatricDoseMg(
        120,
        25,
        paracetamol.dose_per_m2_mg,
        paracetamol.max_daily_mg,
      ),
      drug: paracetamol,
    },
    {
      prescription_id: PRESCRIPTION_DEMO_ID,
      drug_id: ibuprofen.drug_id,
      height_cm: 110,
      weight_kg: 20,
      dose: calculatePediatricDoseMg(
        110,
        20,
        ibuprofen.dose_per_m2_mg,
        ibuprofen.max_daily_mg,
      ),
      drug: ibuprofen,
    },
  ],
};

export function clonePrescriptionDetail(src: PrescriptionDetailResponse): PrescriptionDetailResponse {
  return JSON.parse(JSON.stringify(src)) as PrescriptionDetailResponse;
}

export function loadStaticPrescriptionDetail(prescriptionId: number): PrescriptionDetailResponse | null {
  if (prescriptionId === MOCK_PRESCRIPTION_DETAIL.prescription.prescription_id) {
    return clonePrescriptionDetail(MOCK_PRESCRIPTION_DETAIL);
  }
  return null;
}

export function prescriptionDraftLineCount(): number {
  return MOCK_PRESCRIPTION_DETAIL.lines.length;
}
