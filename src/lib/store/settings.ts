import { create } from 'zustand'
import { fetchSubjects } from '../api/subjects'
import { fetchMaterials } from '../api/materials'
import { fetchSubCategories } from '../api/subcategory'
import { fetchAlertSettings } from '../api/alertSettings'
import type { SubCategory, AlertSettings } from '../../types/workspace'

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  thresholdDays: 3,
  includeUntouched: true,
}

interface SettingsState {
  subjects: string[]
  materials: string[]
  subCategories: SubCategory[]
  alertSettings: AlertSettings
  subjectsLoaded: boolean
  materialsLoaded: boolean
  subCategoriesLoaded: boolean
  setSubjects: (subjects: string[]) => void
  setMaterials: (materials: string[]) => void
  setSubCategories: (subCategories: SubCategory[]) => void
  setAlertSettings: (settings: AlertSettings) => void
  loadSubjects: () => Promise<void>
  loadMaterials: () => Promise<void>
  loadSubCategories: () => Promise<void>
  loadAlertSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  subjects: [],
  materials: [],
  subCategories: [],
  alertSettings: DEFAULT_ALERT_SETTINGS,
  subjectsLoaded: false,
  materialsLoaded: false,
  subCategoriesLoaded: false,
  setSubjects: (subjects) => set({ subjects }),
  setMaterials: (materials) => set({ materials }),
  setSubCategories: (subCategories) => set({ subCategories }),
  setAlertSettings: (alertSettings) => set({ alertSettings }),
  loadSubjects: async () => {
    if (get().subjectsLoaded) return
    try {
      const subjects = await fetchSubjects()
      set({ subjects, subjectsLoaded: true })
    } catch {
      // silent fail
    }
  },
  loadMaterials: async () => {
    if (get().materialsLoaded) return
    try {
      const materials = await fetchMaterials()
      set({ materials, materialsLoaded: true })
    } catch {
      // silent fail
    }
  },
  loadSubCategories: async () => {
    if (get().subCategoriesLoaded) return
    try {
      const subCategories = await fetchSubCategories()
      set({ subCategories, subCategoriesLoaded: true })
    } catch {
      // silent fail
    }
  },
  loadAlertSettings: async () => {
    try {
      const alertSettings = await fetchAlertSettings()
      set({ alertSettings })
    } catch {
      // silent fail — keep default
    }
  },
}))
