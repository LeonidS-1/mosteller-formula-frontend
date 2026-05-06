import type { FormEvent } from "react";
import { useState } from "react";
import Form from "react-bootstrap/Form";
import { useNavigate, useParams } from "react-router-dom";
import { fallbackImageUrl, resolveDrugMediaUrl } from "../../lib/drugMedia";
import { calculatePediatricDoseMg } from "../../lib/pediatricDose";
import { clonePrescriptionDetail, loadStaticPrescriptionDetail } from "../../modules/prescriptionDraftMock";
import type { PrescriptionDetailResponse, PrescriptionDrugDetailJSON } from "../../modules/types";
import { ROUTES } from "../../routePaths";

function withRecalculatedDoses(src: PrescriptionDetailResponse): PrescriptionDetailResponse {
  const lines = src.lines.map((row) => ({
    ...row,
    dose: calculatePediatricDoseMg(
      row.height_cm,
      row.weight_kg,
      row.drug.dose_per_m2_mg,
      row.drug.max_daily_mg,
    ),
  }));
  const completed = lines.filter((l) => l.height_cm > 0 && l.weight_kg > 0).length;
  return {
    ...src,
    lines,
    prescription: { ...src.prescription, completed_dose_line_count: completed },
  };
}

/** Как [inv/templates/prescription.html](inv/templates/prescription.html): доза считается по росту/весу (Mosteller), не вводится. */
function PrescriptionDraftInner({ prescriptionId }: { prescriptionId: string }) {
  const navigate = useNavigate();
  const initial = loadStaticPrescriptionDetail(Number(prescriptionId));
  const [data, setData] = useState<PrescriptionDetailResponse | null>(() =>
    initial ? withRecalculatedDoses(clonePrescriptionDetail(initial)) : null,
  );

  const setDoctorFullName = (doctor_full_name: string) => {
    setData((prev) =>
      prev ? { ...prev, prescription: { ...prev.prescription, doctor_full_name } } : prev,
    );
  };

  const updateLine = (drugId: number, patch: Partial<Pick<PrescriptionDrugDetailJSON, "height_cm" | "weight_kg">>) => {
    setData((prev) => {
      if (!prev) return prev;
      const lines = prev.lines.map((row) => {
        if (row.drug_id !== drugId) return row;
        const next = { ...row, ...patch };
        const dose = calculatePediatricDoseMg(
          next.height_cm,
          next.weight_kg,
          next.drug.dose_per_m2_mg,
          next.drug.max_daily_mg,
        );
        return { ...next, dose };
      });
      const completed = lines.filter((l) => l.height_cm > 0 && l.weight_kg > 0).length;
      return {
        ...prev,
        lines,
        prescription: { ...prev.prescription, completed_dose_line_count: completed },
      };
    });
  };

  const handleDelete = (e: FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Удалить черновик рецепта?")) return;
    navigate(ROUTES.DRUG_CATALOG);
  };

  if (!data) {
    return <p className="application-not-found">Рецепт не найден.</p>;
  }

  const rx = data.prescription;

  return (
    <div className="prescription-detail">
      <div className="prescription-detail__header-card">
        <h1 className="prescription-detail__title">Рецепт на расчёт детской дозы</h1>
        <div className="prescription-detail__info">
          <div className="prescription-detail__info-item">
            <strong>Номер рецепта:</strong> {rx.prescription_id}
          </div>
          <div className="prescription-detail__info-item">
            <strong>Препаратов в рецепте:</strong> {data.lines.length}
          </div>
        </div>
        <Form.Group className="prescription-detail__field" controlId="prescription-doctor-full-name">
          <Form.Label>ФИО врача</Form.Label>
          <Form.Control
            type="text"
            value={rx.doctor_full_name}
            onChange={(e) => setDoctorFullName(e.target.value)}
            placeholder="Фамилия Имя Отчество"
          />
        </Form.Group>
      </div>

      <table className="dose-table">
        <thead>
          <tr>
            <th className="dose-table__col-photo">Изображение</th>
            <th>Препарат</th>
            <th>Рост (см)</th>
            <th>Вес (кг)</th>
            <th className="dose-table__col-result">Доза (мг)</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((row) => {
            const photo = resolveDrugMediaUrl(row.drug.photo_url) || fallbackImageUrl();
            const doseMg = calculatePediatricDoseMg(
              row.height_cm,
              row.weight_kg,
              row.drug.dose_per_m2_mg,
              row.drug.max_daily_mg,
            );
            return (
              <tr key={`${row.prescription_id}-${row.drug_id}`}>
                <td className="dose-table__col-photo">
                  <img src={photo} alt={row.drug.title} />
                </td>
                <td>{row.drug.title}</td>
                <td>
                  <Form.Control
                    type="number"
                    min={0}
                    value={row.height_cm}
                    onChange={(e) =>
                      updateLine(row.drug_id, {
                        height_cm: Number(e.target.value) || 0,
                      })
                    }
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    min={0}
                    value={row.weight_kg}
                    onChange={(e) =>
                      updateLine(row.drug_id, {
                        weight_kg: Number(e.target.value) || 0,
                      })
                    }
                  />
                </td>
                <td className="dose-table__col-result">{doseMg.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <form className="prescription-detail__delete-form" onSubmit={handleDelete}>
        <button type="submit" className="btn-delete">
          Удалить черновик
        </button>
      </form>
    </div>
  );
}

export default function PrescriptionDraftPage() {
  const { prescriptionId } = useParams();

  if (!prescriptionId) {
    return <p className="application-not-found">Рецепт не найден.</p>;
  }

  return <PrescriptionDraftInner key={prescriptionId} prescriptionId={prescriptionId} />;
}
