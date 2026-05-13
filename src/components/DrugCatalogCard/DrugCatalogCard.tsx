import { Link } from "react-router-dom";
import { useState, type MouseEvent } from "react";
import { fallbackImageUrl, resolveDrugMediaUrl } from "../../lib/drugMedia";
import type { DrugCatalogItem } from "../../modules/types";
import { ROUTES } from "../../routePaths";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addDrugToPrescription } from "../../store/slices/prescriptionSlice";

function photoSrc(photo_url: string, imageError: boolean): string {
  if (imageError || !photo_url?.trim()) return fallbackImageUrl();
  return resolveDrugMediaUrl(photo_url);
}

/** Карточка препарата. Для авторизованных — кнопка «Добавить в рецепт» (м-м через thunk). */
export default function DrugCatalogCard({
  drug,
  similarityScore,
}: {
  drug: DrugCatalogItem;
  similarityScore?: number;
}) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);
  const applicationMutationLoading = useAppSelector(
    (s) => s.prescription.applicationMutationLoading,
  );

  const [imageError, setImageError] = useState(false);
  const imageUrl = photoSrc(drug.photo_url, imageError);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      await dispatch(addDrugToPrescription(drug.drug_id)).unwrap();
    } catch (err) {
      window.alert(String(err));
    }
  };

  const to = ROUTES.DRUG_DETAIL.replace(":drugId", String(drug.drug_id));
  const cardClassName = `card${!isAuthenticated ? " card--no-add-btn" : ""}`;

  return (
    <div className="card-wrapper">
      <Link to={to} className={cardClassName}>
        {similarityScore != null && (
          <div className="card__similarity-badge">
            {(similarityScore * 100).toFixed(1)}% сходство
          </div>
        )}
        <img
          src={imageError ? fallbackImageUrl() : imageUrl}
          alt={drug.title}
          onError={handleImageError}
        />
        <div className="card__body">
          <h2 className="card__title">{drug.title}</h2>
          <div className="card__coefficients">
            <div className="card__coeff-item card__coeff-item--latency">
              <span className="card__coeff-label">Разовая (взр.)</span>
              <span className="card__coeff-value">{drug.adult_dose_mg.toFixed(0)} мг</span>
            </div>
            <div className="card__coeff-item card__coeff-item--throughput">
              <span className="card__coeff-label">На м² ППТ</span>
              <span className="card__coeff-value">{drug.dose_per_m2_mg.toFixed(0)} мг/м²</span>
            </div>
            <div className="card__coeff-item card__coeff-item--reliability">
              <span className="card__coeff-label">Макс. сут.</span>
              <span className="card__coeff-value">{drug.max_daily_mg.toFixed(0)} мг</span>
            </div>
          </div>
        </div>
      </Link>
      {isAuthenticated ? (
        <button
          type="button"
          className="card-add-btn"
          onClick={handleAdd}
          disabled={applicationMutationLoading}
        >
          {applicationMutationLoading ? "Добавление…" : "Добавить в рецепт"}
        </button>
      ) : null}
    </div>
  );
}
