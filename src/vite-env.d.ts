/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_LAN_IP?: string;
  readonly VITE_API_PORT?: string;
  readonly VITE_MEDIA_PORT?: string;
  readonly VITE_MEDIA_BUCKET?: string;
  readonly VITE_USE_DEV_PROXY?: string;
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
