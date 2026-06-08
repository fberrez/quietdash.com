/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" marks a build that is hosted apart from its server (e.g. Tauri). */
  readonly VITE_STANDALONE?: string;
  /** Default absolute server URL for standalone builds; overridden at runtime. */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
