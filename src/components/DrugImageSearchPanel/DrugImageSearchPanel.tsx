import { type ChangeEvent, type RefObject, useRef } from "react";
import { Alert, Button, ProgressBar } from "react-bootstrap";
import "./DrugImageSearchPanel.css";

/* ---------- Preview ---------- */

interface DrugImagePreviewProps {
  selectedImage: string | null;
  className?: string;
  /** При true клик по превью открывает выбор файла (как «Загрузить изображение»). */
  previewOpensFilePicker?: boolean;
  onPreviewOpenFilePicker?: () => void;
  /** Сброс выбранного фото: крестик справа от превью, только при `selectedImage`. */
  onClearSelected?: () => void;
}

export function DrugImagePreview({
  selectedImage,
  className,
  previewOpensFilePicker,
  onPreviewOpenFilePicker,
  onClearSelected,
}: DrugImagePreviewProps) {
  const base = ["drug-image-search-panel__preview-wrap", className].filter(Boolean).join(" ");
  const imgAlt =
    previewOpensFilePicker && onPreviewOpenFilePicker ? "" : "Загруженное изображение";
  const inner = selectedImage ? (
    <img
      src={selectedImage}
      alt={imgAlt}
      className="drug-image-search-panel__preview-image"
      draggable={false}
    />
  ) : (
    <div className="drug-image-search-panel__placeholder-image">Нет фото</div>
  );

  if (previewOpensFilePicker && onPreviewOpenFilePicker) {
    const showClearStrip = Boolean(selectedImage && onClearSelected);

    if (showClearStrip) {
      const clusterClass = ["drug-image-search-panel__preview-cluster", className]
        .filter(Boolean)
        .join(" ");
      return (
        <div className={clusterClass}>
          <button
            type="button"
            className="drug-image-search-panel__preview-cluster__open"
            onClick={onPreviewOpenFilePicker}
            aria-label="Загрузить другое изображение"
            title="Загрузить изображение"
          >
            {inner}
          </button>
          <button
            type="button"
            className="drug-image-search-panel__preview-cluster__clear"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearSelected?.();
            }}
            aria-label="Сбросить изображение"
            title="Сбросить"
          >
            <span className="drug-image-search-panel__preview-cluster__clear-mark" aria-hidden>
              ×
            </span>
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        className={`${base} drug-image-search-panel__preview-wrap--picker`}
        onClick={onPreviewOpenFilePicker}
        aria-label="Загрузить изображение для поиска"
        title="Загрузить изображение"
      >
        {inner}
      </button>
    );
  }

  return <div className={base}>{inner}</div>;
}

/* ---------- Controls ---------- */

interface DrugImageSearchControlsProps {
  progress: number;
  ready: boolean;
  showProgress: boolean;
  workerError: string | null;
  catalogEmpty: boolean;
  modelLoading: boolean;
  /** Общий ref на скрытый input (например для клика по превью снаружи). */
  fileInputRef?: RefObject<HTMLInputElement | null>;
  /** Встраивание в однострочный тулбар каталога (`display: contents` у обёртки). */
  layout?: "default" | "catalog-toolbar";
  onLoadModel: () => void;
  onImageSelected: (file: File) => void;
}

export function DrugImageSearchControls({
  progress,
  ready,
  showProgress,
  workerError,
  catalogEmpty,
  modelLoading,
  fileInputRef: fileInputRefProp,
  layout = "default",
  onLoadModel,
  onImageSelected,
}: DrugImageSearchControlsProps) {
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = fileInputRefProp ?? localFileInputRef;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageSelected(file);
  };

  const rowClass =
    layout === "catalog-toolbar"
      ? "toolbar__clip-controls"
      : "drug-image-search-panel__controls-row";

  if (workerError) {
    const alert = (
      <Alert variant="info" className="drug-image-search-panel__alert mb-0">
        Не удалось загрузить модель или обработать запрос: {workerError}
      </Alert>
    );
    if (layout === "catalog-toolbar") {
      return <div className="toolbar__clip-banner">{alert}</div>;
    }
    return alert;
  }

  if (catalogEmpty) {
    const empty = (
      <p className="drug-image-search-panel__empty-catalog mb-0">
        Сначала загрузите каталог препаратов.
      </p>
    );
    if (layout === "catalog-toolbar") {
      return <div className="toolbar__clip-banner">{empty}</div>;
    }
    return empty;
  }

  return (
    <div className={rowClass}>
      {ready ? (
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="drug-image-search-panel__file-input"
          onChange={handleChange}
        />
      ) : (
        <>
          <Button
            className="drug-image-search-panel__btn-upload"
            variant="primary"
            size="sm"
            onClick={onLoadModel}
            disabled={modelLoading}
          >
            {modelLoading ? "Загрузка модели..." : "Поиск по фото"}
          </Button>
          {showProgress ? (
            <ProgressBar
              className="drug-image-search-panel__progress drug-image-search-panel__progress--inline"
              now={progress}
              label={`${Math.round(progress)}%`}
              animated
            />
          ) : null}
        </>
      )}
    </div>
  );
}

/* ---------- Combined (legacy default export) ---------- */

interface DrugImageSearchPanelProps {
  selectedImage: string | null;
  progress: number;
  ready: boolean;
  showProgress: boolean;
  workerError: string | null;
  catalogEmpty: boolean;
  modelLoading: boolean;
  onLoadModel: () => void;
  onImageSelected: (file: File) => void;
  onReset: () => void;
}

export default function DrugImageSearchPanel(props: DrugImageSearchPanelProps) {
  const sharedFileInputRef = useRef<HTMLInputElement>(null);
  const previewOpensPicker =
    props.ready && !props.workerError && !props.catalogEmpty;

  return (
    <section className="drug-image-search-panel" aria-labelledby="drug-image-search-title">
      <h2 id="drug-image-search-title" className="drug-image-search-panel__heading">
        Поиск препарата по изображению
      </h2>
      <div className="drug-image-search-panel__panel">
        {previewOpensPicker ? (
          <DrugImagePreview
            selectedImage={props.selectedImage}
            previewOpensFilePicker
            onPreviewOpenFilePicker={() => sharedFileInputRef.current?.click()}
            onClearSelected={() => {
              props.onReset();
              const input = sharedFileInputRef.current;
              if (input) input.value = "";
            }}
          />
        ) : null}
        <DrugImageSearchControls
          fileInputRef={sharedFileInputRef}
          progress={props.progress}
          ready={props.ready}
          showProgress={props.showProgress}
          workerError={props.workerError}
          catalogEmpty={props.catalogEmpty}
          modelLoading={props.modelLoading}
          onLoadModel={props.onLoadModel}
          onImageSelected={props.onImageSelected}
        />
      </div>
    </section>
  );
}
