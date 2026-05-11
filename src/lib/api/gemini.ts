import { apiFetch } from '../client'
import type { GeminiContext } from '../../types/workspace'

export async function fetchGeminiContext(year: number, month: number): Promise<GeminiContext> {
    const res = await apiFetch(`/api/gemini/context?year=${year}&month=${month}`)
    if (!res.ok) throw new Error(`fetchGeminiContext: ${res.status}`)
    return res.json()
}
