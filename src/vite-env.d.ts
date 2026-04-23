/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Редирект после письма (подтверждение / сброс пароля) */
  readonly VITE_AUTH_CALLBACK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
