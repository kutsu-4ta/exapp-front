import { useAuthStore } from './store/auth'

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = useAuthStore.getState().token
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(endpoint, { ...options, headers })

    if (res.status === 401) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
    }

    return res
}
