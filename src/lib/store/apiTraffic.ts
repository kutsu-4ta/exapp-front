import {create} from 'zustand'
import {type AiModel, getWeight, MODEL_LIMITS, TINY} from '../api/apiWeights'

function todayMidnightMs(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

interface ApiTrafficState {
  /** モデルごとのタイムスタンプ履歴。今日分のみ保持。 */
  histories: Partial<Record<AiModel, number[]>>
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

const DEFAULT_MODEL: AiModel = 'gemini-2.5-flash-lite'

export const useApiTrafficStore = create<ApiTrafficState>()((set, get) => ({
  histories: {},
  rpdLimit: MODEL_LIMITS[DEFAULT_MODEL].rpdLimit,
  rpmLimit: MODEL_LIMITS[DEFAULT_MODEL].rpmLimit,
  activeModel: DEFAULT_MODEL,

  setActiveModel: (model) => {
    const { rpdLimit, rpmLimit } = MODEL_LIMITS[model]
    set({ activeModel: model, rpdLimit, rpmLimit })
  },

  recordRequest: (endpoint) => {
    const { activeModel } = get()
    if (getWeight(endpoint, activeModel) <= TINY) return
    const now = Date.now()
    const midnight = todayMidnightMs()
    set((s) => ({
      histories: {
        ...s.histories,
        [activeModel]: [...(s.histories[activeModel] ?? []).filter((t) => t >= midnight), now],
      },
    }))
  },

  pruneHistory: () => {
    const { activeModel, histories } = get()
    const midnight = todayMidnightMs()
    const hist = histories[activeModel] ?? []
    if (!hist.some((t) => t < midnight)) return
    set((s) => ({
      histories: {
        ...s.histories,
        [activeModel]: hist.filter((t) => t >= midnight),
      },
    }))
  },

  todayCount: () => {
    const { activeModel, histories } = get()
    const midnight = todayMidnightMs()
    return (histories[activeModel] ?? []).filter((t) => t >= midnight).length
  },

  lastMinuteCount: () => {
    const { activeModel, histories } = get()
    const cutoff = Date.now() - 60_000
    return (histories[activeModel] ?? []).filter((t) => t >= cutoff).length
  },

  canRequest: (endpoint) => {
    const { activeModel, rpdLimit, rpmLimit } = get()
    if (getWeight(endpoint, activeModel) <= TINY) return true
    if (get().todayCount() >= rpdLimit) return false
    if (get().lastMinuteCount() >= rpmLimit) return false
    return true
  },

  rpmRecoveryMs: () => {
    const { activeModel, histories, rpmLimit } = get()
    const now = Date.now()
    const hist = histories[activeModel] ?? []
    const rpmWindow = hist.filter((t) => t >= now - 60_000)
    if (rpmWindow.length < rpmLimit) return null
    const oldest = Math.min(...rpmWindow)
    return Math.max(0, oldest + 60_000 - now)
  },
}))
