/**
 * URL страницы после подтверждения письма / сброса пароля.
 * В Supabase → Authentication → URL: добавьте тот же URL в «Redirect URLs».
 */
const DEFAULT = 'https://newproject.arturs-ruhmans.workers.dev/login'

export function getAuthCallbackUrl(): string {
  const fromEnv = import.meta.env.VITE_AUTH_CALLBACK_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '') || fromEnv
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/login`
  }
  return DEFAULT
}
