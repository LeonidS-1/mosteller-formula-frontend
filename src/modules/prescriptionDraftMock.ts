import type { PrescriptionDetailResponse } from "./types";

/** Демо-ID черновика рецепта для маршрута `/prescriptions/:prescriptionId` (статический mock). */
export const PRESCRIPTION_DEMO_ID = 1;

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
    completed_dose_line_count: 0,
  },
  lines: [
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
