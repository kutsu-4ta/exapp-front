import {create} from 'zustand'
import {fetchAllSubjectSettings, fetchSubjects} from '../api/subjects'
import {fetchMaterials} from '../api/materials'
import {fetchSubjectAlertSettings} from '../api/subjectAlertSettings'
import type {SubjectAlertSettings} from '../../types/workspace'

interface SettingsState {
  subjects: string[]
  materials: string[]
  subjectAlertSettings: Record<string, SubjectAlertSettings>
  subjectColors: Record<string, string>
  subjectsLoaded: boolean
  materialsLoaded: boolean
  lastUsedMaterial: string
  setSubjects: (subjects: string[]) => void
  setMaterials: (materials: string[]) => void
  setSubjectAlertSettings: (subject: string, settings: SubjectAlertSettings) => void
  setSubjectColor: (subject: string, color: string | null) => void
  setLastUsedMaterial: (material: string) => void
  loadSubjects: () => Promise<void>
  loadSubjectColors: (subjects: string[]) => Promise<void>
  loadMaterials: () => Promise<void>
  loadSubjectAlertSettings: (subject: string) => Promise<void>
  loadAllSubjectAlertSettings: (subjects: string[]) => Promise<void>
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  subjects: [],
  materials: [],
  subjectAlertSettings: {},
  subjectColors: {},
  subjectsLoaded: false,
  materialsLoaded: false,
  lastUsedMaterial: localStorage.getItem('lastUsedMaterial') ?? '',
  setSubjects: (subjects) => set({ subjects }),
  setMaterials: (materials) => set({ materials }),
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
      get().loadSubjectColors(subjects)
    } catch {
      // silent fail
    }
  },
  loadSubjectColors: async (_subjects: string[]) => {
    try {
      const items = await fetchAllSubjectSettings()
      const next: Record<string, string> = { ...get().subjectColors }
      for (const item of items) {
        if (item.themeColor) next[item.subject] = item.themeColor
      }
      set({ subjectColors: next })
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
