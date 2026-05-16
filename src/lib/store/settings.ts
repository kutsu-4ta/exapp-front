import {create} from 'zustand'
import {fetchSubjects} from '../api/subjects'
import {fetchMaterials} from '../api/materials'
import {fetchSubCategories} from '../api/subcategory'
import {fetchSubjectAlertSettings} from '../api/subjectAlertSettings'
import type {SubCategory, SubjectAlertSettings} from '../../types/workspace'

interface SettingsState {
  subjects: string[]
  materials: string[]
  subCategories: SubCategory[]
  subjectAlertSettings: Record<string, SubjectAlertSettings>
  subjectColors: Record<string, string>
  subjectsLoaded: boolean
  materialsLoaded: boolean
  subCategoriesLoaded: boolean
  lastUsedMaterial: string
  setSubjects: (subjects: string[]) => void
  setMaterials: (materials: string[]) => void
  setSubCategories: (subCategories: SubCategory[]) => void
  setSubjectAlertSettings: (subject: string, settings: SubjectAlertSettings) => void
  setSubjectColor: (subject: string, color: string | null) => void
  setLastUsedMaterial: (material: string) => void
  loadSubjects: () => Promise<void>
  loadMaterials: () => Promise<void>
  loadSubCategories: () => Promise<void>
  loadSubjectAlertSettings: (subject: string) => Promise<void>
  loadAllSubjectAlertSettings: (subjects: string[]) => Promise<void>
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  subjects: [],
  materials: [],
  subCategories: [],
  subjectAlertSettings: {},
  subjectColors: {},
  subjectsLoaded: false,
  materialsLoaded: false,
  subCategoriesLoaded: false,
  lastUsedMaterial: localStorage.getItem('lastUsedMaterial') ?? '',
  setSubjects: (subjects) => set({ subjects }),
  setMaterials: (materials) => set({ materials }),
  setSubCategories: (subCategories) => set({ subCategories }),
  setSubjectAlertSettings: (subject, settings) =>
    set((s) => ({ subjectAlertSettings: { ...s.subjectAlertSettings, [subject]: settings } })),
  setSubjectColor: (subject, color) =>
    set((s) => {
      const next = { ...s.subjectColors }
      if (color) next[subject] = color
      else delete next[subject]
      return { subjectColors: next }
    }),
  setLastUsedMaterial: (material) => {
    localStorage.setItem('lastUsedMaterial', material)
    set({ lastUsedMaterial: material })
  },
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
