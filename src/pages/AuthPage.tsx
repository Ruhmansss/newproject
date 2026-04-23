import { type FormEvent, useEffect, useId, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthMode = 'login' | 'register'

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Неверный email или пароль'
  }
  if (message.includes('User already registered')) {
    return 'Пользователь с таким email уже зарегистрирован'
  }
  if (message.includes('Password')) {
    return 'Слабый пароль. Используйте не менее 8 символов'
  }
  return message
}

function LoggedInView({ user, onSignOut, loading }: { user: User; onSignOut: () => void; loading: boolean }) {
  return (
    <div className="auth">
      <div className="auth__grid auth__grid--single">
        <section className="auth__panel" aria-label="Сессия">
          <div className="auth__brand">
            <span className="auth__badge">
              <span className="auth__badgeIcon" aria-hidden>
                ✦
              </span>
              AI Vibe Board
            </span>
            <h1 className="auth__headline">
              <span className="auth__headlineMain">С возвращением</span>
            </h1>
            <p className="auth__lead">Вы вошли как {user.email}</p>
          </div>
          <div className="auth__card">
            <button
              type="button"
              className="auth__btn auth__btn--primary"
              onClick={onSignOut}
              disabled={loading}
            >
              Выйти
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const emailId = useId()
  const passwordId = useId()
  const nameId = useId()
  const confirmId = useId()

  const subtitle =
    mode === 'login'
      ? 'Войдите, чтобы продолжить работу с AI Vibe Board'
      : 'Заполните поля, чтобы присоединиться к команде'

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  function clearMessages() {
    setError(null)
    setInfo(null)
  }

  function switchMode(next: AuthMode) {
    setMode(next)
    clearMessages()
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    if (mode === 'register') {
      const passwordConfirm = (form.elements.namedItem('confirm') as HTMLInputElement).value
      if (password !== passwordConfirm) {
        setError('Пароли не совпадают')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError(mapAuthError(signInError.message))
        }
        return
      }

      const nameInput = form.elements.namedItem('name') as HTMLInputElement | null
      const name = nameInput?.value.trim() ?? ''

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: name ? { full_name: name } : undefined },
      })
      if (signUpError) {
        setError(mapAuthError(signUpError.message))
        return
      }
      if (data.session) {
        return
      }
      setInfo('Проверьте почту: мы отправили ссылку для подтверждения')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  async function onForgotPassword() {
    const email = window.prompt('Введите email для сброса пароля:')
    if (!email?.trim()) return
    setError(null)
    setInfo(null)
    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/`,
    })
    setLoading(false)
    if (resetError) {
      setError(mapAuthError(resetError.message))
      return
    }
    setInfo('Если аккаунт существует, письмо со ссылкой отправлено на почту')
  }

  async function onSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
  }

  if (!authReady) {
    return null
  }

  if (user) {
    return <LoggedInView user={user} onSignOut={onSignOut} loading={loading} />
  }

  return (
    <div className="auth">
      <div className="auth__grid">
        <section className="auth__panel" aria-label="Форма авторизации">
          <div className="auth__brand">
            <span className="auth__badge">
              <span className="auth__badgeIcon" aria-hidden>
                ✦
              </span>
              AI-powered таск-менеджер
            </span>

            {mode === 'login' ? (
              <h1 className="auth__headline">
                <span className="auth__headlineMain">С возвращением</span>
                <span className="auth__headlineBlock">
                  <span className="auth__headlineGradient">и продолжить</span>
                </span>
              </h1>
            ) : (
              <h1 className="auth__headline">
                <span className="auth__headlineMain">Создать </span>
                <span className="auth__headlineGradient">аккаунт</span>
              </h1>
            )}

            <p className="auth__lead">{subtitle}</p>
          </div>

          <form className="auth__card" onSubmit={onSubmit}>
            {error && (
              <p className="auth__message auth__message--err" role="alert">
                {error}
              </p>
            )}
            {info && <p className="auth__message auth__message--ok">{info}</p>}

            {mode === 'register' && (
              <div className="auth__field">
                <label className="auth__label" htmlFor={nameId}>
                  Имя
                </label>
                <input
                  id={nameId}
                  className="auth__input"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Как вас зовут"
                  disabled={loading}
                />
              </div>
            )}

            <div className="auth__field">
              <label className="auth__label" htmlFor={emailId}>
                Email
              </label>
              <input
                id={emailId}
                className="auth__input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="auth__field">
              <label className="auth__label" htmlFor={passwordId}>
                Пароль
              </label>
              <input
                id={passwordId}
                className="auth__input"
                type="password"
                name="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            {mode === 'register' && (
              <div className="auth__field">
                <label className="auth__label" htmlFor={confirmId}>
                  Подтвердите пароль
                </label>
                <input
                  id={confirmId}
                  className="auth__input"
                  type="password"
                  name="confirm"
                  autoComplete="new-password"
                  placeholder="Повторите пароль"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="auth__row">
                <label className="auth__check">
                  <input type="checkbox" name="remember" disabled={loading} /> Запомнить меня
                </label>
                <button
                  type="button"
                  className="auth__link"
                  onClick={onForgotPassword}
                  disabled={loading}
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            <div className="auth__actions">
              <button
                type="submit"
                className="auth__btn auth__btn--primary"
                disabled={loading}
                aria-busy={loading}
              >
                <span className="auth__btnIcon" aria-hidden>
                  {loading ? '…' : '✦'}
                </span>
                {loading
                  ? 'Подождите…'
                  : mode === 'login'
                    ? 'Войти'
                    : 'Зарегистрироваться'}
              </button>
            </div>

            <p className="auth__switch">
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button
                type="button"
                className="auth__link auth__link--strong"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                disabled={loading}
              >
                {mode === 'login' ? 'Регистрация' : 'Войти'}
              </button>
            </p>
          </form>
        </section>

        <aside className="auth__visual" aria-hidden>
          <div className="auth__visualFrame">
            <div className="auth__visualGlow" />
            <div className="auth__mock">
              <div className="auth__mockTop">
                <span className="auth__mockDot" />
                <span className="auth__mockDot" />
                <span className="auth__mockDot" />
              </div>
              <div className="auth__mockBody">
                <div className="auth__mockSidebar" />
                <div className="auth__mockContent">
                  <div className="auth__mockBar" />
                  <div className="auth__mockBar auth__mockBar--short" />
                  <div className="auth__mockGrid">
                    <div className="auth__mockCard" />
                    <div className="auth__mockCard" />
                    <div className="auth__mockCard" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
