import {useAuthStore} from './store/auth'
import {useApiTrafficStore} from './store/apiTraffic'

const BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_BACKEND_ROOT

export class ApiTrafficLimitError extends Error {
  readonly reason: 'rpd' | 'rpm'
  constructor(reason: 'rpd' | 'rpm') {
    super(
      reason === 'rpd'
        ? '本日のAI利用上限に達しました（1日20回）'
        : '少し待ってから再試行してください（毎分5回まで）'
    )
    this.name = 'ApiTrafficLimitError'
    this.reason = reason
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token
  const traffic = useApiTrafficStore.getState()

  if (!traffic.canRequest(endpoint)) {
    const reason = traffic.todayCount() >= traffic.rpdLimit ? 'rpd' : 'rpm'
    throw new ApiTrafficLimitError(reason)
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`

  const method = (options.method ?? 'GET').toUpperCase()
  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE'

  const headers: Record<string, string> = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })

  if (res.ok) {
    traffic.recordRequest(endpoint)
  }

  if (res.status === 401) {
    useAuthStore.getState().logout()

    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }

  return res
}

// Content-Type を自動設定させる FormData 用アップロード（multipart/form-data）
export async function apiUpload(endpoint: string, formData: FormData) {
  const token = useAuthStore.getState().token
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers, body: formData })

  if (res.status === 401) {
    useAuthStore.getState().logout()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }

  return res
}
