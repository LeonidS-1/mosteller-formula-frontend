/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** База без завершающего слэша, например `/minio/test` или `http://localhost:9000/test` */
  readonly VITE_MINIO_BASE?: string;
  /** Имя бакета, если база задаётся только хостом (опционально) */
  readonly VITE_MINIO_BUCKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*?worker" {
  const workerConstructor: {
    new (options?: { name?: string }): Worker;
  };
  export default workerConstructor;
}

declare module "*?worker&inline" {
  const workerConstructor: {
    new (options?: { name?: string }): Worker;
  };
  export default workerConstructor;
}
