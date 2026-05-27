import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import BreadCrumbs from "../../components/BreadCrumbs/BreadCrumbs";
import DrugCatalogFilterBar from "../../components/DrugCatalogFilterBar/DrugCatalogFilterBar";
import DrugCatalogGrid from "../../components/DrugCatalogGrid/DrugCatalogGrid";
import DrugCatalogGuestSearchAgent from "../../components/DrugCatalogGuestSearchAgent/DrugCatalogGuestSearchAgent";
import {
  DrugImagePreview,
  DrugImageSearchControls,
} from "../../components/DrugImageSearchPanel/DrugImageSearchPanel";
import { resolveDrugMediaUrl } from "../../lib/drugMedia";
import {
  useDrugImageSearch,
  type ClipDrugItem,
} from "../../hooks/useDrugImageSearch";
import { listDrugs } from "../../modules/drugsApi";
import {
  DRUGS_CATALOG_MOCK,
  filterDrugsCatalog,
  resolveDrugClipDescription,
} from "../../modules/drugsCatalogMock";
import type { DrugCatalogFilterCriteria, DrugCatalogItem } from "../../modules/types";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setCatalogFilters } from "../../store/slices/drugCatalogSlice";

const POLLING_MS = 4000;

export default function DrugCatalogPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.drugCatalog.filters);

  const [clipSourceDrugs, setClipSourceDrugs] = useState<DrugCatalogItem[]>([]);
  const [displayDrugs, setDisplayDrugs] = useState<DrugCatalogItem[]>([]);
  const [draftTitle, setDraftTitle] = useState(filters.title);
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clipSessionActive, setClipSessionActive] = useState(false);
  const clipImageFileInputRef = useRef<HTMLInputElement>(null);
  const useMockRef = useRef(false);

  useEffect(() => {
    useMockRef.current = useMock;
  }, [useMock]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftTitle(filters.title);
  }, [filters.title]);

  const loadCatalog = useCallback(async (title: string, background = false) => {
    if (!background) setLoading(true);
    const trimmed = title.trim();
    try {
      if (!trimmed) {
        const data = await listDrugs();
        if (data.length > 0) {
          setClipSourceDrugs(data);
          setDisplayDrugs(data);
          setUseMock(false);
          useMockRef.current = false;
        } else {
          setClipSourceDrugs(DRUGS_CATALOG_MOCK);
          setDisplayDrugs(DRUGS_CATALOG_MOCK);
          setUseMock(true);
          useMockRef.current = true;
        }
      } else {
        const filtered = await listDrugs({ title: trimmed });
        if (filtered.length > 0) {
          setDisplayDrugs(filtered);
          setUseMock(false);
          useMockRef.current = false;
        } else if (useMockRef.current) {
          setDisplayDrugs(filterDrugsCatalog(DRUGS_CATALOG_MOCK, { title: trimmed }));
        } else {
          setDisplayDrugs([]);
        }
      }
    } catch {
      if (!trimmed) {
        setClipSourceDrugs(DRUGS_CATALOG_MOCK);
        setDisplayDrugs(DRUGS_CATALOG_MOCK);
      } else {
        setDisplayDrugs(filterDrugsCatalog(DRUGS_CATALOG_MOCK, { title: trimmed }));
      }
      setUseMock(true);
      useMockRef.current = true;
    } finally {
      if (!background) setLoading(false);
    }
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
        photo_url: resolveDrugMediaUrl(drug.photo_url),
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

  const imageSearchActive = Boolean(imageEmbedding);

  useEffect(() => {
    if (imageSearchActive) return;

    let cancelled = false;
    const tick = (background: boolean) => {
      if (cancelled) return;
      void loadCatalog(filters.title, background);
    };

    tick(false);
    const id = window.setInterval(() => tick(true), POLLING_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [filters.title, imageSearchActive, loadCatalog]);

  const handleSearch = () => {
    dispatch(setCatalogFilters({ title: draftTitle.trim() }));
  };

  const handleApplyAgentCriteria = (criteria: DrugCatalogFilterCriteria) => {
    dispatch(setCatalogFilters(criteria));
  };

  const handleLoadModel = () => {
    if (!clipSessionActive) setClipSessionActive(true);
  };

  const handleImageSelected = (file: File) => {
    if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
    const blobUrl = URL.createObjectURL(file);
    setSelectedImage(blobUrl);
    searchByImage(file);
  };

  const handleResetImageSearch = () => {
    if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
    resetSearch();
    const input = clipImageFileInputRef.current;
    if (input) input.value = "";
  };

  const showClipProgress =
    clipSessionActive && clipItems.length > 0 && !clipReady && !workerError;

  const clipDrugsToDisplay = useMemo(() => {
    if (!imageSearchActive) return { drugs: [] as DrugCatalogItem[], scores: new Map<number, number>() };
    const visible = clipProcessed.filter((item) => item.isVisible);
    const drugs: DrugCatalogItem[] = [];
    const scores = new Map<number, number>();
    for (const item of visible) {
      const drug = drugById.get(item.drug_id);
      if (drug) {
        drugs.push(drug);
        scores.set(item.drug_id, item.score);
      }
    }
    return { drugs, scores };
  }, [imageSearchActive, clipProcessed, drugById]);

  return (
    <div className="drug-catalog-page">
      <BreadCrumbs />

      <div className="toolbar toolbar--catalog toolbar--catalog-oneline">
        {clipReady && clipItems.length > 0 && !workerError ? (
          <DrugImagePreview
            selectedImage={selectedImage}
            className="toolbar__preview"
            previewOpensFilePicker
            onPreviewOpenFilePicker={() => clipImageFileInputRef.current?.click()}
            onClearSelected={handleResetImageSearch}
          />
        ) : null}

        <DrugImageSearchControls
          layout="catalog-toolbar"
          fileInputRef={clipImageFileInputRef}
          progress={clipProgress}
          ready={clipReady}
          showProgress={showClipProgress}
          workerError={workerError}
          catalogEmpty={clipItems.length === 0}
          modelLoading={clipSessionActive && !clipReady}
          onLoadModel={handleLoadModel}
          onImageSelected={handleImageSelected}
        />

        <DrugCatalogFilterBar
          className="toolbar__filter"
          query={draftTitle}
          onQueryChange={setDraftTitle}
          onSearch={handleSearch}
        />

        <DrugCatalogGuestSearchAgent onApplyCriteria={handleApplyAgentCriteria} />
      </div>

      <div className="space">
        <main className="drug-catalog-page__main">
          {loading ? (
            <div className="drug-catalog-page__loading">
              <Spinner animation="border" role="status" aria-label="Загрузка">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
            </div>
          ) : imageSearchActive ? (
            <div className="drug-catalog-page__grid">
              {clipDrugsToDisplay.drugs.length > 0 ? (
                <DrugCatalogGrid
                  drugs={clipDrugsToDisplay.drugs}
                  scores={clipDrugsToDisplay.scores}
                />
              ) : (
                <div className="drug-catalog-page__empty">
                  Похожих препаратов выше порога не найдено. Попробуйте другое изображение.
                </div>
              )}
            </div>
          ) : (
            <div className="drug-catalog-page__grid">
              {displayDrugs.length > 0 ? (
                <DrugCatalogGrid drugs={displayDrugs} />
              ) : (
                <div className="drug-catalog-page__empty">
                  {filters.title.trim()
                    ? `По запросу «${filters.title}» ничего не найдено`
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
