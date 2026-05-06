import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fallbackImageUrl, resolveDrugMediaUrl } from "../../lib/drugMedia";
import { getMockDrugById } from "../../modules/drugsCatalogMock";
import type { DrugCatalogItem } from "../../modules/types";

/** Как [inv/templates/drug.html](inv/templates/drug.html): только колонка с видео, без правой `.detail-card__body` и без кнопки «В рецепт». */
function DrugDetailInner({ drugId }: { drugId: string }) {
  const drug = useMemo((): DrugCatalogItem | null => {
    const resolved = getMockDrugById(Number(drugId));
    return resolved ?? null;
  }, [drugId]);

  const [mediaError, setMediaError] = useState(false);

  const videoUrl = useMemo(() => (drug ? resolveDrugMediaUrl(drug.video) : ""), [drug]);
  const posterUrl = useMemo(
    () => (drug ? resolveDrugMediaUrl(drug.photo_url) || fallbackImageUrl() : fallbackImageUrl()),
    [drug],
  );
  const showVideo = Boolean(drug?.video?.trim()) && !mediaError;

  if (!drug) {
    return (
      <div className="strategy-not-found">
        <h1>Препарат не найден</h1>
      </div>
    );
  }

  return (
    <div className="detail-wrapper">
      <div className="detail-card">
        <div className="detail-card__video-wrap">
          {showVideo ? (
            <video
              className="detail-card__video"
              controls
              autoPlay
              muted
              loop
              playsInline
              poster={posterUrl}
              onError={() => setMediaError(true)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <img className="detail-card__video" src={posterUrl} alt={drug.title} />
          )}
          <div className="detail-card__video-coefficients">
            <div className="detail-card__coeff-item detail-card__coeff-item--latency">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="detail-card__coeff-value">{drug.adult_dose_mg.toFixed(0)} мг</span>
            </div>
            <div className="detail-card__coeff-item detail-card__coeff-item--throughput">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <polygon
                  points="2,8 12,8 19.5,14.614 9.5,14.614"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="detail-card__coeff-value">{drug.dose_per_m2_mg.toFixed(0)} мг/м²</span>
            </div>
            <div className="detail-card__coeff-item detail-card__coeff-item--reliability">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path
                  d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path d="M8.5 12l2.2 2.2L15.8 9.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="detail-card__coeff-value">{drug.max_daily_mg.toFixed(0)} мг</span>
            </div>
          </div>
          <div className="detail-card__video-bottom">
            <h1 className="detail-card__video-title">{drug.title}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DrugDetailPage() {
  const { drugId } = useParams();

  if (!drugId) {
    return (
      <div className="strategy-not-found">
        <h1>Препарат не найден</h1>
      </div>
    );
  }

  return <DrugDetailInner key={drugId} drugId={drugId} />;
}
