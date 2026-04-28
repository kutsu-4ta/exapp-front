const TOKEN_KEY = 'exapp_token'

export type AuthUser = {
  id: number
  name: string
  email: string
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function register(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
  })

  const data = await res.json()

  if (!res.ok) {
    const firstError =
      data.errors?.name?.[0] ??
      data.errors?.email?.[0] ??
      data.errors?.password?.[0] ??
      data.message ??
      '登録に失敗しました。'
    throw new Error(firstError)
  }

  return data as { token: string; user: AuthUser }
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()

  if (!res.ok) {
    const message = data.errors?.email?.[0] ?? data.message ?? 'ログインに失敗しました。'
    throw new Error(message)
  }

  return data as { token: string; user: AuthUser }
}

export async function logout(): Promise<void> {
  const token = getToken()
  if (token) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => {})
  }
  removeToken()
}

export async function fetchMe(): Promise<AuthUser | null> {
  const token = getToken()
  if (!token) return null

  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    removeToken()
    return null
  }

  return res.json() as Promise<AuthUser>
}
