/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Logo static din `public/` — ex. `/logo.png` */
  readonly VITE_APP_LOGO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
