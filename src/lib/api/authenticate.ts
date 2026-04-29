import {apiFetch} from "@/lib/client";
import {AuthUser} from "@/lib/store/auth";

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

    await apiFetch('/api/auth/logout').catch(() => {})
}