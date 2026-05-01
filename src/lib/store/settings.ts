import { create } from 'zustand'
import { fetchSubjects } from '../api/subjects'
import { fetchMaterials } from '../api/materials'

interface SettingsState {
  subjects: string[]
  materials: string[]
  setSubjects: (subjects: string[]) => void
  loadSubjects: () => Promise<void>
  loadMaterials: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  subjects: [],
  materials: [],
  setSubjects: (subjects) => set({ subjects }),
  loadSubjects: async () => {
    try {
      const subjects = await fetchSubjects()
      set({ subjects })
    } catch {
      // silent fail
    }
  },
  loadMaterials: async () => {
    try {
      const materials = await fetchMaterials()
      set({ materials })
    } catch {
      // silent fail
    }
  },
}))
