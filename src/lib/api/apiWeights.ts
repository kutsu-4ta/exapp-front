// Gemini の実モデル名（ケバブケース）
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-3-flash' | 'gemini-2.5-flash-lite'

export type AiModel = GeminiModel | 'claude-sonnet'

export const HIGH   = 500   // 画像解析・重い生成
export const MIDDLE = 100   // テキスト生成
export const LOW    = 20    // 重めの集計
export const TINY   = 1     // 通常CRUD

type WeightMap = Record<string, number>

// 3つのGeminiモデルはエンドポイントコストが同等
const GEMINI_WEIGHTS: WeightMap = {
  '/api/gemini/context':  HIGH,
  '/api/ai/advice':       MIDDLE,
  '/api/morning-bugfix':  MIDDLE,
  '/api/ai/problems':     MIDDLE,
}

export const API_WEIGHTS: Record<AiModel, WeightMap> = {
  'gemini-2.5-flash':      GEMINI_WEIGHTS,
  'gemini-3-flash':        GEMINI_WEIGHTS,
  'gemini-2.5-flash-lite': GEMINI_WEIGHTS,
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
  'gemini-2.5-flash':      { rpdLimit: 20, rpmLimit: 5 },
  'gemini-3-flash':        { rpdLimit: 20, rpmLimit: 5 },
  'gemini-2.5-flash-lite': { rpdLimit: 20, rpmLimit: 5 },
  'claude-sonnet':         { rpdLimit: 100, rpmLimit: 60 },
}

/** モデルの表示名 */
export const MODEL_DISPLAY_NAMES: Record<AiModel, string> = {
  'gemini-2.5-flash':      'Gemini 2.5 Flash',
  'gemini-3-flash':        'Gemini 3 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  'claude-sonnet':         'Claude Sonnet',
}

/** endpointのprefixで重みを検索。該当なしはTINY（= CRUDエンドポイント）。 */
export function getWeight(endpoint: string, model: AiModel): number {
  const map = API_WEIGHTS[model]
  for (const [pattern, weight] of Object.entries(map)) {
    if (endpoint.startsWith(pattern)) return weight
  }
  return TINY
}
