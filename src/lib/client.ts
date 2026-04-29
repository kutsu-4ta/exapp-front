import {useAuthStore} from "@/lib/store/auth";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    // ストアから現在のトークンを取得
    const token = useAuthStore.getState().token

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {}),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(endpoint, { ...options, headers })

    if (res.status === 401　&& useAuthStore.getState().user !== null) {
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') window.location.href = '/login'
    }

    return res
}