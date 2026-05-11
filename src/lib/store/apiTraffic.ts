import { create } from 'zustand'
import { type AiModel, getWeight, TINY, MODEL_LIMITS } from '../api/apiWeights'

function todayMidnightMs(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

interface ApiTrafficState {
  /** タイムスタンプ（ms）のリスト。今日分のAIリクエストのみ保持。 */
  history: number[]
  rpdLimit: number
  rpmLimit: number
  activeModel: AiModel

  setActiveModel: (model: AiModel) => void
  recordRequest: (endpoint: string) => void
  pruneHistory: () => void
  todayCount: () => number
  lastMinuteCount: () => number
  canRequest: (endpoint: string) => boolean
  /** RPM制限中のとき、次スロットが空くまでのms。制限なしはnull。 */
  rpmRecoveryMs: () => number | null
}

export const useApiTrafficStore = create<ApiTrafficState>()((set, get) => ({
  history: [],
  rpdLimit: MODEL_LIMITS['gemini-flash-lite'].rpdLimit,
  rpmLimit: MODEL_LIMITS['gemini-flash-lite'].rpmLimit,
  activeModel: 'gemini-flash-lite',

  setActiveModel: (model) => {
    const { rpdLimit, rpmLimit } = MODEL_LIMITS[model]
    set({ activeModel: model, rpdLimit, rpmLimit })
  },

  recordRequest: (endpoint) => {
    const { activeModel } = get()
    if (getWeight(endpoint, activeModel) <= TINY) return
    const now = Date.now()
    set((s) => ({
      history: [...s.history.filter(t => t >= todayMidnightMs()), now],
    }))
  },

  pruneHistory: () => {
    const midnight = todayMidnightMs()
    const { history } = get()
    // 今日より前のエントリがなければ何もしない（不要なset回避）
    if (!history.some(t => t < midnight)) return
    set((s) => ({ history: s.history.filter(t => t >= midnight) }))
  },

  todayCount: () => {
    return get().history.filter(t => t >= todayMidnightMs()).length
  },

  lastMinuteCount: () => {
    const cutoff = Date.now() - 60_000
    return get().history.filter(t => t >= cutoff).length
  },

  canRequest: (endpoint) => {
    const { activeModel, rpdLimit, rpmLimit } = get()
    if (getWeight(endpoint, activeModel) <= TINY) return true
    if (get().todayCount() >= rpdLimit) return false
    if (get().lastMinuteCount() >= rpmLimit) return false
    return true
  },

  rpmRecoveryMs: () => {
    const { history, rpmLimit } = get()
    const now = Date.now()
    const rpmWindow = history.filter(t => t >= now - 60_000)
    if (rpmWindow.length < rpmLimit) return null
    const oldest = Math.min(...rpmWindow)
    return Math.max(0, oldest + 60_000 - now)
  },
}))
