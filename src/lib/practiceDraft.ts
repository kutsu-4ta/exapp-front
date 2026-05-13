export const DRAFT_KEY_PREFIX = 'practice_draft_'

export type AnsweredRecord = {
  index: number
  answers: {
    answer: string
    isDoubtful: boolean
    note: string | null
    memos: Record<string, string>
  }[]
  elapsedMs: number
}

export type PracticeDraft = {
  currentIndex: number
  log: AnsweredRecord[]
}

export function draftKey(subject: string): string {
  return `${DRAFT_KEY_PREFIX}${encodeURIComponent(subject)}`
}

export function loadDraft(subject: string): PracticeDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(subject))
    return raw ? (JSON.parse(raw) as PracticeDraft) : null
  } catch {
    return null
  }
}

export function saveDraft(subject: string, draft: PracticeDraft): void {
  try {
    localStorage.setItem(draftKey(subject), JSON.stringify(draft))
  } catch {}
}

export function clearDraft(subject: string): void {
  localStorage.removeItem(draftKey(subject))
}

export function loadAllDrafts(): Array<{ subject: string; draft: PracticeDraft }> {
  const result: Array<{ subject: string; draft: PracticeDraft }> = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(DRAFT_KEY_PREFIX)) continue
      const subject = decodeURIComponent(key.slice(DRAFT_KEY_PREFIX.length))
      const draft = loadDraft(subject)
      if (draft && draft.currentIndex > 1) {
        result.push({ subject, draft })
      }
    }
  } catch {}
  return result
}
