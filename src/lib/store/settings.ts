import {create} from 'zustand'
import {fetchSubjects} from '../api/subjects'
import {fetchMaterials} from '../api/materials'
import {fetchSubCategories} from '../api/subcategory'
import {fetchAlertSettings} from '../api/alertSettings'
import {fetchSubjectAlertSettings} from '../api/subjectAlertSettings'
import type {AlertSettings, SubCategory, SubjectAlertSettings} from '../../types/workspace'

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  thresholdDays: 3,
  includeUntouched: true,
  minutesThresholdDays: 7,
  minutesThreshold: 30,
}

interface SettingsState {
  subjects: string[]
  materials: string[]
  subCategories: SubCategory[]
  alertSettings: AlertSettings
  subjectAlertSettings: Record<string, SubjectAlertSettings>
  subjectsLoaded: boolean
  materialsLoaded: boolean
  subCategoriesLoaded: boolean
  setSubjects: (subjects: string[]) => void
  setMaterials: (materials: string[]) => void
  setSubCategories: (subCategories: SubCategory[]) => void
  setAlertSettings: (settings: AlertSettings) => void
  setSubjectAlertSettings: (subject: string, settings: SubjectAlertSettings) => void
  loadSubjects: () => Promise<void>
  loadMaterials: () => Promise<void>
  loadSubCategories: () => Promise<void>
  loadAlertSettings: () => Promise<void>
  loadSubjectAlertSettings: (subject: string) => Promise<void>
  loadAllSubjectAlertSettings: (subjects: string[]) => Promise<void>
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  subjects: [],
  materials: [],
  subCategories: [],
  alertSettings: DEFAULT_ALERT_SETTINGS,
  subjectAlertSettings: {},
  subjectsLoaded: false,
  materialsLoaded: false,
  subCategoriesLoaded: false,
  setSubjects: (subjects) => set({ subjects }),
  setMaterials: (materials) => set({ materials }),
  setSubCategories: (subCategories) => set({ subCategories }),
  setAlertSettings: (alertSettings) => set({ alertSettings }),
  setSubjectAlertSettings: (subject, settings) =>
    set((s) => ({ subjectAlertSettings: { ...s.subjectAlertSettings, [subject]: settings } })),
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
  loadSubjectAlertSettings: async (subject) => {
    if (get().subjectAlertSettings[subject]) return
    try {
      const settings = await fetchSubjectAlertSettings(subject)
      set((s) => ({ subjectAlertSettings: { ...s.subjectAlertSettings, [subject]: settings } }))
    } catch {
      // silent fail — widget falls back to DEFAULT_SUBJECT_ALERT_SETTINGS
    }
  },
  loadAllSubjectAlertSettings: async (subjects) => {
    const loaded = get().subjectAlertSettings
    const missing = subjects.filter((s) => !loaded[s])
    await Promise.all(missing.map((s) => get().loadSubjectAlertSettings(s)))
  },
}))
