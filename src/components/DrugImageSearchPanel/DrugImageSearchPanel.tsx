import { type ChangeEvent, useRef } from "react";
import { Alert, Button, ProgressBar } from "react-bootstrap";
import "./DrugImageSearchPanel.css";

interface DrugImageSearchPanelProps {
  /** Превью выбранного изображения (blob URL). */
  selectedImage: string | null;
  /** Прогресс загрузки нейросети, 0..100. */
  progress: number;
  /** Текстовые эмбеддинги готовы — можно искать. */
  ready: boolean;
  /** Воркер ещё не загрузил модель и идёт прогресс. */
  showProgress: boolean;
  /** Сообщение об ошибке инициализации/обработки. */
  workerError: string | null;
  /** Каталог пуст — поиск нечего инициализировать. */
  catalogEmpty: boolean;
  /** Кнопка загрузки — disabled. */
  uploadDisabled: boolean;
  /** Подпись на кнопке загрузки. */
  uploadLabel: string;
  /** Можно ли сбросить выбранное изображение. */
  canReset: boolean;
  /** Параметры порога/TopK — отображаются под формой как подсказка. */
  thresholdHint: string;
  onImageSelected: (file: File) => void;
  onReset: () => void;
}

export default function DrugImageSearchPanel({
  selectedImage,
  progress,
  ready,
  showProgress,
  workerError,
  catalogEmpty,
  uploadDisabled,
  uploadLabel,
  canReset,
  thresholdHint,
  onImageSelected,
  onReset,
}: DrugImageSearchPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  const handleReset = () => {
    onReset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section
      className="drug-image-search-panel"
      aria-labelledby="drug-image-search-title"
    >
      <h2 id="drug-image-search-title" className="drug-image-search-panel__heading">
        Поиск препарата по изображению
      </h2>

      {workerError ? (
        <Alert variant="info" className="drug-image-search-panel__alert">
          Не удалось загрузить модель или обработать запрос: {workerError}
        </Alert>
      ) : null}

      {catalogEmpty ? (
        <p className="drug-image-search-panel__empty-catalog">
          Сначала загрузите каталог препаратов.
        </p>
      ) : (
        <div className="drug-image-search-panel__panel">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="drug-image-search-panel__file-input"
            onChange={handleChange}
          />

          <div className="drug-image-search-panel__preview-wrap">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Загруженное изображение"
                className="drug-image-search-panel__preview-image"
              />
            ) : (
              <div className="drug-image-search-panel__placeholder-image">Нет фото</div>
            )}
          </div>

          <div className="drug-image-search-panel__action-panel">
            <Button
              className="drug-image-search-panel__btn-upload"
              variant="primary"
              onClick={handleUploadClick}
              disabled={uploadDisabled}
            >
              {uploadLabel}
            </Button>

            {showProgress ? (
              <ProgressBar
                className="drug-image-search-panel__progress"
                now={progress}
                label={`${Math.round(progress)}%`}
                animated
              />
            ) : null}

            <Button
              variant="outline-primary"
              className="drug-image-search-panel__btn-reset"
              onClick={handleReset}
              disabled={!canReset}
            >
              Сбросить
            </Button>

            <p className="drug-image-search-panel__hint">{thresholdHint}</p>
            {ready ? (
              <p className="drug-image-search-panel__hint drug-image-search-panel__hint--ready">
                Модель готова к поиску
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
