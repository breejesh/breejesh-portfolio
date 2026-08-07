/// <reference types="vite/client" />

/**
 * Vite client types for Analog (import.meta.env.SSR, import.meta.env.PROD, etc.).
 * Required so RouteMeta guards and SSR branches typecheck under tsc.
 */
interface ImportMetaEnv {
  readonly SSR: boolean;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
