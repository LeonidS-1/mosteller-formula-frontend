import { useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate, useParams } from "react-router-dom";
import { fallbackImageUrl, resolveDrugMediaUrl } from "../../lib/drugMedia";
import { calculatePediatricDoseMg } from "../../lib/pediatricDose";
import {
  clonePrescriptionDetail,
  loadStaticPrescriptionDetail,
} from "../../modules/prescriptionDraftMock";
import type {
  PrescriptionDetailResponse,
  PrescriptionDrugDetailJSON,
} from "../../modules/types";
import { ROUTES } from "../../routePaths";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  deletePrescription,
  fetchPrescriptionDetail,
  formPrescription,
  removePrescriptionDrugLine,
} from "../../store/slices/prescriptionSlice";
import "./PrescriptionDraftPage.css";

type RowDraft = Pick<PrescriptionDrugDetailJSON, "height_cm" | "weight_kg">;

export default function PrescriptionDraftPage() {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.user);
  const {
    detail,
    detailLoading,
    detailError,
    applicationMutationLoading,
    itemMutationLoading,
  } = useAppSelector((s) => s.prescription);

  const [mockData, setMockData] = useState<PrescriptionDetailResponse | null>(null);
  const [doctorDraft, setDoctorDraft] = useState("");
  const [rowDrafts, setRowDrafts] = useState<Record<number, RowDraft>>({});

  const reloadMock = useCallback(() => {
    if (!prescriptionId) return;
    const n = Number(prescriptionId);
    const fallback = loadStaticPrescriptionDetail(n);
    setMockData(fallback ? clonePrescriptionDetail(fallback) : null);
  }, [prescriptionId]);

  useEffect(() => {
    if (!prescriptionId || !isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMockData(null);
    void dispatch(fetchPrescriptionDetail(Number(prescriptionId))).then((a) => {
      if (fetchPrescriptionDetail.rejected.match(a)) {
        reloadMock();
      }
    });
  }, [prescriptionId, isAuthenticated, dispatch, reloadMock]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const data = detail ?? mockData;

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDoctorDraft(data.prescription.doctor_full_name ?? "");
    const next: Record<number, RowDraft> = {};
    data.lines.forEach((row) => {
      next[row.drug_id] = {
        height_cm: row.height_cm,
        weight_kg: row.weight_kg,
      };
    });
    setRowDrafts(next);
  }, [data]);

  const rx = data?.prescription;
  const prescriptionIdNum = rx?.prescription_id;
  const isDraft = rx?.status === "draft";
  const busy = applicationMutationLoading || detailLoading;

  const updateRowDraft = useCallback((drugId: number, patch: Partial<RowDraft>) => {
    setRowDrafts((prev) => {
      const base = prev[drugId] ?? { height_cm: 0, weight_kg: 0 };
      return {
        ...prev,
        [drugId]: { ...base, ...patch },
      };
    });
  }, []);

  const rmBusy = (drugId: number) => Boolean(itemMutationLoading[`rm-${drugId}`]);

  const handleRemoveRow = (drugId: number) => {
    if (!prescriptionIdNum || !isDraft || mockData) return;
    if (!window.confirm("Убрать препарат из рецепта?")) return;
    void dispatch(removePrescriptionDrugLine({ drugId, prescriptionId: prescriptionIdNum }));
  };

  const handleForm = () => {
    if (!prescriptionIdNum || !isDraft || mockData) return;
    void dispatch(formPrescription(prescriptionIdNum));
  };

  const handleDeletePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionIdNum || !isDraft) return;
    if (!window.confirm("Удалить черновик рецепта?")) return;
    if (mockData) {
      navigate(ROUTES.DRUG_CATALOG, { replace: true });
      return;
    }
    void dispatch(deletePrescription(prescriptionIdNum)).then(() => {
      navigate(ROUTES.DRUG_CATALOG, { replace: true });
    });
  };

  if (!isAuthenticated) return null;

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
      {busy ? (
        <div className="prescription-detail-page__blocking" aria-live="polite">
          <Spinner animation="border" size="sm" /> Обработка…
        </div>
      ) : null}
      <div
        className={`prescription-detail ${busy ? "prescription-detail--blocked" : ""}`}
      >
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
          <Form.Group className="prescription-detail__field" controlId="prescription-doctor-full-name">
            <Form.Label>ФИО врача</Form.Label>
            <Form.Control
              type="text"
              value={doctorDraft}
              onChange={(e) => setDoctorDraft(e.target.value)}
              placeholder="Фамилия Имя Отчество"
              disabled={!isDraft || Boolean(mockData)}
            />
          </Form.Group>
          {isDraft && !mockData ? (
            <div className="prescription-detail__method-actions">
              <button
                type="button"
                className="prescription-detail__method-btn prescription-detail__method-btn--accent"
                disabled={busy}
                onClick={handleForm}
              >
                Оформить рецепт
              </button>
            </div>
          ) : null}
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
              const draft = rowDrafts[row.drug_id];
              const localHeight = draft?.height_cm ?? row.height_cm;
              const localWeight = draft?.weight_kg ?? row.weight_kg;
              const previewDose = calculatePediatricDoseMg(
                localHeight,
                localWeight,
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
                  <td>
                    <Form.Control
                      type="number"
                      min={0}
                      value={localHeight}
                      disabled={!isDraft}
                      onChange={(e) =>
                        updateRowDraft(row.drug_id, {
                          height_cm: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      min={0}
                      value={localWeight}
                      disabled={!isDraft}
                      onChange={(e) =>
                        updateRowDraft(row.drug_id, {
                          weight_kg: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="dose-table__col-result">
                    {isDraft
                      ? previewDose.toFixed(1)
                      : serverDose != null
                        ? serverDose.toFixed(1)
                        : "—"}
                  </td>
                  {isDraft ? (
                    <td className="dose-table__actions">
                      <button
                        type="button"
                        className="prescription-detail__row-btn prescription-detail__row-btn--danger"
                        disabled={busy || rmBusy(row.drug_id) || Boolean(mockData)}
                        onClick={() => handleRemoveRow(row.drug_id)}
                      >
                        Убрать препарат
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>

        {isDraft ? (
          <form
            className="prescription-detail__delete-form"
            onSubmit={handleDeletePrescription}
          >
            <button type="submit" className="btn-delete" disabled={busy || Boolean(mockData)}>
              Удалить рецепт
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
