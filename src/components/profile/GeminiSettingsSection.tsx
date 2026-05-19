import {useEffect, useState} from 'react'
import {getCached, setCached} from '../../lib/pageCache'
import {fetchGeminiSettings, GEMINI_MODEL_OPTIONS, type GeminiModel, updateGeminiSettings} from '../../lib/api/gemini'
import {updateUserProfile} from '../../lib/api/profile'
import {useApiTrafficStore} from '../../lib/store/apiTraffic'
import {useAuthStore} from '../../lib/store/auth'
import type {AiModel} from '../../lib/api/apiWeights'
import {c, font} from '../../styles/notion'

export function GeminiSettingsSection() {
  const user = useAuthStore((state) => state.user)
  const setActiveModel = useApiTrafficStore((s) => s.setActiveModel)

  const [geminiModel, setGeminiModel] = useState<GeminiModel | null>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelSaved, setModelSaved] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)

  const [geminiToken, setGeminiToken] = useState('')
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenSaved, setTokenSaved] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [isTokenRegistered, setIsTokenRegistered] = useState(user?.geminiTokenSet ?? false)

  useEffect(() => {
    const cached = getCached<{ geminiModel: GeminiModel }>('profile-gemini-settings')
    if (cached?.geminiModel) {
      setGeminiModel(cached.geminiModel)
      setActiveModel(cached.geminiModel as AiModel)
    }
    fetchGeminiSettings()
      .then((s) => {
        if (s.geminiModel) {
          setGeminiModel(s.geminiModel)
          setActiveModel(s.geminiModel as AiModel)
          setCached('profile-gemini-settings', { geminiModel: s.geminiModel })
        }
      })
      .catch(() => {})
  }, [])

  const handleModelSave = async () => {
    if (!geminiModel) return
    setModelLoading(true)
    setModelError(null)
    setModelSaved(false)
    try {
      await updateGeminiSettings(geminiModel)
      setActiveModel(geminiModel as AiModel)
      setModelSaved(true)
      setTimeout(() => setModelSaved(false), 2000)
    } catch (e) {
      setModelError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setModelLoading(false)
    }
  }

  const handleTokenSave = async () => {
    if (!geminiToken.trim()) return
    setTokenLoading(true)
    setTokenError(null)
    setTokenSaved(false)
    try {
      await updateUserProfile({ geminiToken: geminiToken.trim() })
      setTokenSaved(true)
      setIsTokenRegistered(true)
      setGeminiToken('')
      setTimeout(() => setTokenSaved(false), 2000)
    } catch (e) {
      setTokenError(e instanceof Error ? e.message : 'トークンの保存に失敗しました')
    } finally {
      setTokenLoading(false)
    }
  }

  return (
    <div style={block}>
      <p style={subLabel}>使用モデル</p>
      <p style={note}>AIアドバイス・朝の復習・画像解析で使用するGeminiモデルを選択します。</p>
      {modelError && <p style={errorText}>{modelError}</p>}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {GEMINI_MODEL_OPTIONS.map((opt) => {
          const selected = geminiModel === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setGeminiModel(opt.value)}
              disabled={modelLoading}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid', fontSize: '12px', fontWeight: selected ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', backgroundColor: selected ? 'rgba(35,131,226,0.08)' : 'transparent', borderColor: selected ? 'rgba(35,131,226,0.35)' : 'rgba(55,53,47,0.12)', color: selected ? '#2383e2' : 'rgba(55,53,47,0.55)' }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {geminiModel && <p style={{ fontSize: '11px', color: 'rgba(55,53,47,0.35)', marginBottom: '12px', fontFamily: 'monospace' }}>{geminiModel}</p>}
      <div style={saveRow}>
        <button onClick={handleModelSave} disabled={modelLoading || !geminiModel} style={{ ...saveBtn, backgroundColor: geminiModel ? '#2383e2' : 'rgba(55,53,47,0.2)' }}>
          {modelLoading ? '保存中...' : 'モデルを保存'}
        </button>
        {modelSaved && <span style={savedText}>保存しました</span>}
      </div>

      <div style={divider} />

      <p style={subLabel}>Gemini APIキー</p>
      <p style={note}>独自のAPIキーを使用することで、より高度な解析機能を利用できます。</p>
      {tokenError && <p style={errorText}>{tokenError}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="password"
          style={textInput}
          value={geminiToken}
          onChange={(e) => setGeminiToken(e.target.value)}
          placeholder={isTokenRegistered ? '●●●●●●●● (登録済み)' : 'AIアドバイス用のキーを入力'}
        />
        <div style={saveRow}>
          <button onClick={handleTokenSave} disabled={tokenLoading || !geminiToken.trim()} style={{ ...saveBtn, backgroundColor: geminiToken.trim() ? '#2383e2' : 'rgba(55,53,47,0.2)' }}>
            {tokenLoading ? '保存中...' : 'APIキーを更新'}
          </button>
          {tokenSaved && <span style={savedText}>保存しました</span>}
        </div>
      </div>
    </div>
  )
}

const block: React.CSSProperties = { border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px', backgroundColor: '#fff' }
const subLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: c.text }
const note: React.CSSProperties = { fontSize: '11px', color: 'rgba(55,53,47,0.45)', marginBottom: '16px', lineHeight: 1.6 }
const errorText: React.CSSProperties = { fontSize: '12px', color: c.red, marginBottom: '12px' }
const saveRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const saveBtn: React.CSSProperties = { padding: '8px 16px', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const savedText: React.CSSProperties = { fontSize: '12px', color: '#0f9d58', fontWeight: 500 }
const divider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55,53,47,0.07)', margin: '20px 0' }
const textInput: React.CSSProperties = { border: '1px solid rgba(55,53,47,0.12)', borderRadius: '4px', padding: '8px 10px', fontSize: font.base, color: c.text, outline: 'none', backgroundColor: 'rgba(55,53,47,0.02)', width: '100%', boxSizing: 'border-box' }
