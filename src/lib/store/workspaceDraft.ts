import {create} from 'zustand'
import {persist} from 'zustand/middleware'

export type DraftRow = {
  minutes: string
  subject: string
  material: string
  subCategoryName: string
  memo: string
}

interface WorkspaceDraftState {
  drafts: Record<string, DraftRow>
  setDraft: (key: string, draft: DraftRow) => void
  clearDraft: (key: string) => void
}

export const useWorkspaceDraftStore = create<WorkspaceDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (key, draft) => set((s) => ({drafts: {...s.drafts, [key]: draft}})),
      clearDraft: (key) =>
        set((s) => {
          const next = {...s.drafts}
          delete next[key]
          return {drafts: next}
        }),
    }),
    {name: 'workspace-draft'}
  )
)
