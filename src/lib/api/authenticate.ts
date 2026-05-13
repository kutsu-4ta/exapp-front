import {apiFetch} from '../client'
import type {AuthUser} from '../store/auth'

/**
 * Googleログイン (Firebase ID Token検証)
 */
export async function googleLogin(idToken: string): Promise<{ token: string; user: AuthUser }> {
  const res = await apiFetch('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Googleログインに失敗しました。')
  }

  return data as { token: string; user: AuthUser }
}

/**
 * ログアウト
 */
export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', {
    method: 'POST',
  }).catch((err) => {
    console.error('Logout API failed:', err)
    // サーバー側が失敗しても、フロント側のステート破棄を優先させるため
    // ここでは rethrow せずに飲み込む設計とする
  })
}
