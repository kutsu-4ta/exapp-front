import { apiFetch } from "@/lib/client";
import { AuthUser } from "@/lib/store/auth";

/**
 * 新規登録
 */
export async function register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
): Promise<{ token: string; user: AuthUser }> {
    const res = await apiFetch('/api/auth/register', {
        method: 'POST',
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

/**
 * メールアドレス・パスワードログイン
 */
export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
        const message = data.errors?.email?.[0] ?? data.message ?? 'ログインに失敗しました。'
        throw new Error(message)
    }

    return data as { token: string; user: AuthUser }
}

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
        method: 'POST'
    }).catch((err) => {
        console.error('Logout API failed:', err)
        // サーバー側が失敗しても、フロント側のステート破棄を優先させるため
        // ここでは rethrow せずに飲み込む設計とする
    })
}