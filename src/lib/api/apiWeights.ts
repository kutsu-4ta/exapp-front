export type AiModel = 'gemini-flash-lite' | 'claude-sonnet'

export const HIGH   = 500   // 画像解析・重い生成
export const MIDDLE = 100   // テキスト生成
export const LOW    = 20    // 重めの集計
export const TINY   = 1     // 通常CRUD

type WeightMap = Record<string, number>

export const API_WEIGHTS: Record<AiModel, WeightMap> = {
  'gemini-flash-lite': {
    '/api/gemini/context':  HIGH,
    '/api/ai/advice':       MIDDLE,
    '/api/morning-bugfix':  MIDDLE,
    '/api/ai/problems':     MIDDLE,
  },
  'claude-sonnet': {
    '/api/gemini/context':  800,
    '/api/ai/advice':       150,
    '/api/morning-bugfix':  150,
    '/api/ai/problems':     150,
  },
}

export type ModelLimits = { rpdLimit: number; rpmLimit: number }

/** モデルごとのRPD（1日上限）/ RPM（1分上限）設定 */
export const MODEL_LIMITS: Record<AiModel, ModelLimits> = {
  'gemini-flash-lite': { rpdLimit: 20, rpmLimit: 5 },
  'claude-sonnet':     { rpdLimit: 100, rpmLimit: 60 },
}

/** endpointのprefixで重みを検索。該当なしはTINY（= CRUDエンドポイント）。 */
export function getWeight(endpoint: string, model: AiModel): number {
  const map = API_WEIGHTS[model]
  for (const [pattern, weight] of Object.entries(map)) {
    if (endpoint.startsWith(pattern)) return weight
  }
  return TINY
}
