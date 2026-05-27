import { useCallback, useEffect, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { useParams } from "react-router-dom";
import { fallbackImageUrl, resolveDrugMediaUrl } from "../../lib/drugMedia";
import { calculatePediatricDoseMg } from "../../lib/pediatricDose";
import {
  clonePrescriptionDetail,
  loadStaticPrescriptionDetail,
} from "../../modules/prescriptionDraftMock";
import type { PrescriptionDetailResponse } from "../../modules/types";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchPrescriptionDetail } from "../../store/slices/prescriptionSlice";
import "./PrescriptionDraftPage.css";

export default function PrescriptionDraftPage() {
  const { prescriptionId } = useParams();
  const dispatch = useAppDispatch();
  const { detail, detailLoading, detailError } = useAppSelector((s) => s.prescription);

  const [mockData, setMockData] = useState<PrescriptionDetailResponse | null>(null);

  const reloadMock = useCallback(() => {
    if (!prescriptionId) return;
    const n = Number(prescriptionId);
    const fallback = loadStaticPrescriptionDetail(n);
    setMockData(fallback ? clonePrescriptionDetail(fallback) : null);
  }, [prescriptionId]);

  useEffect(() => {
    if (!prescriptionId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMockData(null);
    void dispatch(fetchPrescriptionDetail(Number(prescriptionId))).then((a) => {
      if (fetchPrescriptionDetail.rejected.match(a)) {
        reloadMock();
      }
    });
  }, [prescriptionId, dispatch, reloadMock]);

  const data = detail ?? mockData;

  const rx = data?.prescription;
  const prescriptionIdNum = rx?.prescription_id;

  if (detailLoading && !data) {
    return (
      <div className="prescription-detail-page">
        <div className="prescription-detail-page__loading">
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  if (!data || !rx || prescriptionIdNum == null) {
    return (
      <div className="prescription-detail-page">
        <p className="prescription-not-found">
          {detailError ? detailError : "Рецепт не найден."}
        </p>
      </div>
    );
  }

  return (
    <div className="prescription-detail-page">
      <div className="prescription-detail">
        <div className="prescription-detail__header-card">
          <h1 className="prescription-detail__title">Рецепт на расчёт детской дозы</h1>
          <div className="prescription-detail__info">
            <div className="prescription-detail__info-item">
              <strong>Номер рецепта:</strong> {prescriptionIdNum}
            </div>
            <div className="prescription-detail__info-item">
              <strong>Препаратов в рецепте:</strong> {data.lines.length}
            </div>
          </div>
          <div className="prescription-detail__info-item">
            <strong>ФИО врача:</strong> {rx.doctor_full_name || "—"}
          </div>
        </div>

        <div className="prescription-detail__table-wrap">
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
                const previewDose = calculatePediatricDoseMg(
                  row.height_cm,
                  row.weight_kg,
                  row.drug.dose_per_m2_mg,
                  row.drug.max_daily_mg,
                );
                const serverDose = row.dose;
                return (
                  <tr key={`${row.prescription_id}-${row.drug_id}`}>
                    <td className="dose-table__col-photo">
                      <img src={photo} alt={row.drug.title} />
                    </td>
                    <td>{row.drug.title}</td>
                    <td>{row.height_cm}</td>
                    <td>{row.weight_kg}</td>
                    <td className="dose-table__col-result">
                      {serverDose != null ? serverDose.toFixed(1) : previewDose.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
