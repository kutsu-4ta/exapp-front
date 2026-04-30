import { useAuthStore } from './store/auth'

const BASE_URL = import.meta.env.VITE_BACKEND_ROOT || ''

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = useAuthStore.getState().token

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(url, { ...options, headers })

    if (res.status === 401) {
        useAuthStore.getState().logout()

        if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login'
        }
    }

    return res
}