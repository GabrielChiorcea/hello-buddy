/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Logo static din `public/` — ex. `/logo.png` */
  readonly VITE_APP_LOGO_URL?: string;
  /** Ex. https://back.domeniu.ro/graphql când API e pe alt subdomeniu */
  readonly VITE_GRAPHQL_ENDPOINT?: string;
  /** Ex. https://back.domeniu.ro — imagini /storage, REST, refresh cookie */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
