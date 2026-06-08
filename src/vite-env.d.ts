/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_DATABASE_URL?: string;
  readonly VITE_FORCE_LOCAL?: string;
  readonly VITE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
