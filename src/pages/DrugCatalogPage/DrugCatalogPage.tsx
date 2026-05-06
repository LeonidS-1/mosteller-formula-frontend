import { useEffect, useMemo, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { Link } from "react-router-dom";
import BreadCrumbs from "../../components/BreadCrumbs/BreadCrumbs";
import DrugCatalogFilterBar from "../../components/DrugCatalogFilterBar/DrugCatalogFilterBar";
import DrugCatalogGrid from "../../components/DrugCatalogGrid/DrugCatalogGrid";
import DrugImageSearchPanel from "../../components/DrugImageSearchPanel/DrugImageSearchPanel";
import { fallbackImageUrl, resolveDrugMediaUrl } from "../../lib/drugMedia";
import {
  CLIP_SIMILARITY_THRESHOLD,
  CLIP_TOP_K,
  useDrugImageSearch,
  type ClipDrugItem,
} from "../../hooks/useDrugImageSearch";
import { listDrugs } from "../../modules/drugsApi";
import {
  DRUGS_CATALOG_MOCK,
  filterDrugsCatalog,
  resolveDrugClipDescription,
} from "../../modules/drugsCatalogMock";
import type { DrugCatalogItem } from "../../modules/types";
import { ROUTES } from "../../routePaths";

export default function DrugCatalogPage() {
  const [clipSourceDrugs, setClipSourceDrugs] = useState<DrugCatalogItem[]>([]);
  const [displayDrugs, setDisplayDrugs] = useState<DrugCatalogItem[]>([]);
  const [searchTitle, setSearchTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clipSessionActive, setClipSessionActive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const data = await listDrugs();
        if (cancelled) return;
        if (data.length > 0) {
          setClipSourceDrugs(data);
          setDisplayDrugs(data);
          setUseMock(false);
        } else {
          setClipSourceDrugs(DRUGS_CATALOG_MOCK);
          setDisplayDrugs(DRUGS_CATALOG_MOCK);
          setUseMock(true);
        }
      } catch {
        if (cancelled) return;
        setClipSourceDrugs(DRUGS_CATALOG_MOCK);
        setDisplayDrugs(DRUGS_CATALOG_MOCK);
        setUseMock(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (selectedImage?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  const clipItems: ClipDrugItem[] = useMemo(
    () =>
      clipSourceDrugs.map((drug) => ({
        drug_id: drug.drug_id,
        description_en: resolveDrugClipDescription(drug),
      })),
    [clipSourceDrugs],
  );

  const {
    items: clipProcessed,
    ready: clipReady,
    progress: clipProgress,
    imageEmbedding,
    workerError,
    searchByImage,
    resetSearch,
  } = useDrugImageSearch(clipItems, clipSessionActive);

  const drugById = useMemo(() => {
    const map = new Map<number, DrugCatalogItem>();
    clipSourceDrugs.forEach((drug) => map.set(drug.drug_id, drug));
    return map;
  }, [clipSourceDrugs]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filtered = await listDrugs({ title: searchTitle });
      if (filtered.length > 0) {
        setDisplayDrugs(filtered);
        setUseMock(false);
      } else if (useMock) {
        setDisplayDrugs(filterDrugsCatalog(DRUGS_CATALOG_MOCK, { title: searchTitle }));
      } else {
        setDisplayDrugs([]);
      }
    } catch {
      setDisplayDrugs(filterDrugsCatalog(DRUGS_CATALOG_MOCK, { title: searchTitle }));
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelected = (file: File) => {
    if (!clipSessionActive) setClipSessionActive(true);
    if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
    const blobUrl = URL.createObjectURL(file);
    setSelectedImage(blobUrl);
    searchByImage(file);
  };

  const handleResetImageSearch = () => {
    if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
    resetSearch();
  };

  const imageSearchActive = Boolean(imageEmbedding);
  const showClipProgress =
    clipSessionActive && clipItems.length > 0 && !clipReady && !workerError;
  const uploadLabel =
    clipSessionActive && !clipReady ? "Загрузка нейросети..." : "Загрузить изображение";
  const uploadDisabled = clipItems.length === 0 || (clipSessionActive && !clipReady);
  const visibleClipRows = imageSearchActive
    ? clipProcessed.filter((item) => item.isVisible)
    : [];
  const thresholdHint = `Порог сходства: ${CLIP_SIMILARITY_THRESHOLD.toFixed(2)} | TopK: ${CLIP_TOP_K}`;

  return (
    <div className="drug-catalog-page">
      <div className="toolbar toolbar--catalog">
        <div className="toolbar__breadcrumbs">
          <BreadCrumbs className="app-breadcrumbs--toolbar" />
        </div>
        <div className="toolbar__center">
          <DrugCatalogFilterBar
            query={searchTitle}
            onQueryChange={setSearchTitle}
            onSearch={handleSearch}
          />
        </div>
      </div>
      <div className="space">
        <main className="drug-catalog-page__main">
          <DrugImageSearchPanel
            selectedImage={selectedImage}
            progress={clipProgress}
            ready={clipReady}
            showProgress={showClipProgress}
            workerError={workerError}
            catalogEmpty={clipItems.length === 0}
            uploadDisabled={uploadDisabled}
            uploadLabel={uploadLabel}
            canReset={Boolean(selectedImage)}
            thresholdHint={thresholdHint}
            onImageSelected={handleImageSelected}
            onReset={handleResetImageSearch}
          />

          {loading ? (
            <div className="drug-catalog-page__loading">
              <Spinner animation="border" role="status" aria-label="Загрузка">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
            </div>
          ) : imageSearchActive ? (
            <div className="drug-catalog-page__grid drug-clip-results">
              {visibleClipRows.length === 0 ? (
                <div className="drug-catalog-page__empty">
                  Похожих препаратов выше порога не найдено. Попробуйте другое изображение.
                </div>
              ) : (
                <ul className="drug-clip-results-list">
                  {visibleClipRows.map((item) => {
                    const drug = drugById.get(item.drug_id);
                    if (!drug) return null;
                    const thumb = resolveDrugMediaUrl(drug.photo_url) || fallbackImageUrl();
                    const to = ROUTES.DRUG_DETAIL.replace(":drugId", String(drug.drug_id));
                    return (
                      <li key={drug.drug_id}>
                        <Link to={to} className="drug-clip-result-row">
                          <img
                            src={thumb}
                            alt={drug.title}
                            className="drug-clip-result-row__image"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = fallbackImageUrl();
                            }}
                          />
                          <div className="drug-clip-result-row__content">
                            <h5>{drug.title}</h5>
                            <p className="drug-clip-result-row__en">{item.description_en}</p>
                            <p className="drug-clip-result-row__ru">{drug.description}</p>
                          </div>
                          <div className="drug-clip-result-row__stats">
                            <div>
                              Сходство:{" "}
                              <span className="drug-clip-result-row__similarity">
                                {(item.score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              Доза взр.: {drug.adult_dose_mg.toFixed(0)} мг
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="drug-catalog-page__grid">
              {displayDrugs.length > 0 ? (
                <DrugCatalogGrid drugs={displayDrugs} />
              ) : (
                <div className="drug-catalog-page__empty">
                  {searchTitle.trim()
                    ? `По запросу «${searchTitle}» ничего не найдено`
                    : "Препараты не найдены"}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
