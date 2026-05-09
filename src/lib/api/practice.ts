import { apiFetch } from '../client'

export type PracticeSessionPayload = {
    subject: string
    date: string
    questions: Array<{
        index: number
        judgement: string
        elapsedMs: number
        note: string | null
        memos: Record<string, string>[]
    }>
    totalElapsedMs: number
}

export type PracticeSessionResult = {
    id: number
    subject: string
    date: string
    totalMinutes: number
}

export async function savePracticeSession(payload: PracticeSessionPayload): Promise<PracticeSessionResult> {
    const res = await apiFetch('/api/practice/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
}
