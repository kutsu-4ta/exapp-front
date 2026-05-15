import {useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '../lib/store/auth'
import {useSettingsStore} from '../lib/store/settings'
import {logout as apiLogout} from '../lib/api/authenticate'
import {deleteMaterial, renameMaterial} from '../lib/api/materials'
import {backBtn, c, font, pageHeading} from '../styles/notion'
import {fetchUserProfile, updateUserProfile} from '@/lib/api/profile'
import {fetchGeminiSettings, GEMINI_MODEL_OPTIONS, type GeminiModel, updateGeminiSettings,} from '@/lib/api/gemini'
import {useApiTrafficStore} from '@/lib/store/apiTraffic'
import type {AiModel} from '@/lib/api/apiWeights'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.logout)

  const materials = useSettingsStore((s) => s.materials)
  const setMaterials = useSettingsStore((s) => s.setMaterials)

  // ── User Profile settings (General) ──────────────────────────────────────
  const [nickname, setNickname] = useState('')
  const [occupation, setOccupation] = useState('')
  const [goal, setGoal] = useState('')
  const [weakAreas, setWeakAreas] = useState('')
  const [strongAreas, setStrongAreas] = useState('')
  const [interests, setInterests] = useState('')

  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // ── Gemini Token settings (Independent) ──────────────────────────────────
  const [geminiToken, setGeminiToken] = useState('')
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenSaved, setTokenSaved] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [isTokenRegistered, setIsTokenRegistered] = useState(user?.geminiTokenSet ?? false)

  const setActiveModel = useApiTrafficStore((s) => s.setActiveModel)

  // ── Gemini Model settings ────────────────────────────────────────────────
  const [geminiModel, setGeminiModel] = useState<GeminiModel | null>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelSaved, setModelSaved] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)

  // ── Material editing ─────────────────────────────────────────────────────
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null)
  const [editingMaterialValue, setEditingMaterialValue] = useState('')
  const [deleteMaterialTarget, setDeleteMaterialTarget] = useState<string | null>(null)
  const [materialError, setMaterialError] = useState<string | null>(null)
  const [materialLoading, setMaterialLoading] = useState(false)
  const materialEditRef = useRef<HTMLInputElement>(null)

  // Initial Load
  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true)
      try {
        const data = await fetchUserProfile()
        if (data) {
          setNickname(data.nickname || '')
          setOccupation(data.occupation || '')
          setGoal(data.goal || '')
          setWeakAreas(data.weakAreas || '')
          setStrongAreas(data.strongAreas || '')
          setInterests(data.interests || '')
          setIsTokenRegistered(data.geminiTokenSet)
        }
      } catch (e) {
        setProfileError(e instanceof Error ? e.message : '読み込みに失敗しました')
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
    fetchGeminiSettings()
      .then((s) => {
        if (s.geminiModel) {
          setGeminiModel(s.geminiModel)
          setActiveModel(s.geminiModel as AiModel)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (editingMaterial !== null) materialEditRef.current?.focus()
  }, [editingMaterial])

  const handleLogout = async () => {
    await apiLogout().catch(() => {})
    clearAuth()
    navigate('/login')
  }

  // ── Profile handlers ─────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    setProfileLoading(true)
    setProfileError(null)
    setProfileSaved(false)
    try {
      // APIキーを除いた情報のみを送信
      await updateUserProfile({
        nickname,
        occupation,
        goal,
        weakAreas,
        strongAreas,
        interests,
      })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setProfileLoading(false)
    }
  }

  // ── Token handler ────────────────────────────────────────────────────────
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

  // ── Gemini Model handler ─────────────────────────────────────────────────
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

  // ── Material handlers ────────────────────────────────────────────────────
  const startEditMaterial = (name: string) => {
    setEditingMaterial(name)
    setEditingMaterialValue(name)
    setMaterialError(null)
  }
  const cancelEditMaterial = () => {
    setEditingMaterial(null)
    setEditingMaterialValue('')
  }

  const handleMaterialRenameSave = async () => {
    const newName = editingMaterialValue.trim()
    if (!editingMaterial || !newName) return
    if (newName === editingMaterial) {
      cancelEditMaterial()
      return
    }
    setMaterialLoading(true)
    setMaterialError(null)
    try {
      await renameMaterial(editingMaterial, newName)
      setMaterials(materials.map((m) => (m === editingMaterial ? newName : m)))
      setEditingMaterial(null)
    } catch (e) {
      setMaterialError(e instanceof Error ? e.message : '変更に失敗しました')
    } finally {
      setMaterialLoading(false)
    }
  }

  const handleMaterialDeleteConfirm = async () => {
    if (!deleteMaterialTarget) return
    setMaterialLoading(true)
    setMaterialError(null)
    try {
      await deleteMaterial(deleteMaterialTarget)
      setMaterials(materials.filter((m) => m !== deleteMaterialTarget))
      setDeleteMaterialTarget(null)
    } catch (e) {
      setMaterialError(e instanceof Error ? e.message : '削除に失敗しました')
    } finally {
      setMaterialLoading(false)
    }
  }

  if (!user) return null

  const initial = nickname?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || '?'

  return (
    <div style={pageWrapper}>
      <div style={content}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ marginRight: '6px' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 style={pageHeading}>プロフィール</h1>

        <div style={avatarWrap}>
          <div style={avatar}>{initial}</div>
        </div>

        {/* 基本情報 */}
        <div style={card}>
          <div style={row}>
            <span style={label}>名前 / メールアドレス</span>
            <span style={value}>
              {user.name} ({user.email})
            </span>
          </div>
        </div>

        {/* AI・パーソナライズ設定 */}
        <div style={sectionHeadingWrap}>
          <span style={sectionHeading}>AI・パーソナライズ設定</span>
        </div>
        <div style={settingsBlock}>
          <p style={settingsNote}>
            ここで入力した内容は、AIエージェントのアドバイスを最適化するために使用されます。
          </p>

          {profileError && <p style={errorText}>{profileError}</p>}

          <div style={formStack}>
            <div style={field}>
              <label style={inputLabel}>ニックネーム</label>
              <input
                style={textInput}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例：タロウ"
              />
            </div>
            <div style={field}>
              <label style={inputLabel}>現在の職業</label>
              <input
                style={textInput}
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="例：ITエンジニア、製造業など"
              />
            </div>
            <div style={field}>
              <label style={inputLabel}>試験の合格目標・ミッション</label>
              <textarea
                style={textArea}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="例：2026年の一発合格を目指しています。"
              />
            </div>
            <div style={fieldRow}>
              <div style={{ flex: 1 }}>
                <label style={inputLabel}>得意な領域</label>
                <textarea
                  style={{ ...textArea, height: '80px' }}
                  value={strongAreas}
                  onChange={(e) => setStrongAreas(e.target.value)}
                  placeholder="マーケ、財務"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={inputLabel}>苦手な領域</label>
                <textarea
                  style={{ ...textArea, height: '80px' }}
                  value={weakAreas}
                  onChange={(e) => setWeakAreas(e.target.value)}
                  placeholder="法務、経済"
                />
              </div>
            </div>
            <div style={field}>
              <label style={inputLabel}>興味・趣味</label>
              <input
                style={textInput}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="例：物理学、哲学、サッカー"
              />
            </div>

            <div style={alertSaveRow}>
              <button onClick={handleProfileSave} disabled={profileLoading} style={saveBtn}>
                {profileLoading ? '保存中...' : 'プロフィールを更新'}
              </button>
              {profileSaved && <span style={savedText}>保存しました</span>}
            </div>
          </div>
        </div>

        {/* 高度な設定 */}
        <div style={sectionHeadingWrap}>
          <span style={sectionHeading}>高度な設定</span>
        </div>
        <div style={settingsBlock}>
          {/* モデル選択 */}
          <p style={settingsSubLabel}>使用モデル</p>
          <p style={settingsNote}>
            AIアドバイス・朝の復習・画像解析で使用するGeminiモデルを選択します。
          </p>

          {modelError && <p style={errorText}>{modelError}</p>}

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {GEMINI_MODEL_OPTIONS.map((opt) => {
              const selected = geminiModel === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setGeminiModel(opt.value)}
                  disabled={modelLoading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    fontSize: '12px',
                    fontWeight: selected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    backgroundColor: selected ? 'rgba(35,131,226,0.08)' : 'transparent',
                    borderColor: selected ? 'rgba(35,131,226,0.35)' : 'rgba(55,53,47,0.12)',
                    color: selected ? '#2383e2' : 'rgba(55,53,47,0.55)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          {geminiModel && (
            <p
              style={{
                fontSize: '11px',
                color: 'rgba(55,53,47,0.35)',
                marginBottom: '12px',
                fontFamily: 'monospace',
              }}
            >
              {geminiModel}
            </p>
          )}
          <div style={alertSaveRow}>
            <button
              onClick={handleModelSave}
              disabled={modelLoading || !geminiModel}
              style={{
                ...saveBtn,
                backgroundColor: geminiModel ? '#2383e2' : 'rgba(55,53,47,0.2)',
              }}
            >
              {modelLoading ? '保存中...' : 'モデルを保存'}
            </button>
            {modelSaved && <span style={savedText}>保存しました</span>}
          </div>

          <div
            style={{ height: '1px', backgroundColor: 'rgba(55,53,47,0.07)', margin: '20px 0' }}
          />

          {/* APIキー */}
          <p style={settingsSubLabel}>Gemini APIキー</p>
          <p style={settingsNote}>
            独自のAPIキーを使用することで、より高度な解析機能を利用できます。
          </p>

          {tokenError && <p style={errorText}>{tokenError}</p>}

          <div style={formStack}>
            <div style={field}>
              <input
                type="password"
                style={textInput}
                value={geminiToken}
                onChange={(e) => setGeminiToken(e.target.value)}
                placeholder={
                  isTokenRegistered ? '●●●●●●●● (登録済み)' : 'AIアドバイス用のキーを入力'
                }
              />
            </div>
            <div style={alertSaveRow}>
              <button
                onClick={handleTokenSave}
                disabled={tokenLoading || !geminiToken.trim()}
                style={{
                  ...saveBtn,
                  backgroundColor: geminiToken.trim() ? '#2383e2' : 'rgba(55, 53, 47, 0.2)',
                }}
              >
                {tokenLoading ? '保存中...' : 'APIキーを更新'}
              </button>
              {tokenSaved && <span style={savedText}>保存しました</span>}
            </div>
          </div>
        </div>

        {/* アプリ設定 */}
        <div style={sectionHeadingWrap}>
          <span style={sectionHeading}>アプリ設定</span>
        </div>

        {/* 教材管理 */}
        <div style={settingsBlock}>
          <p style={settingsSubLabel}>教材管理</p>
          <p style={settingsNote}>教材を削除すると、記録の教材フィールドが空になります。</p>

          {materialError && <p style={errorText}>{materialError}</p>}

          <div style={itemList}>
            {materials.map((name) => (
              <div key={name}>
                {editingMaterial === name ? (
                  <div style={editRow}>
                    <input
                      ref={materialEditRef}
                      value={editingMaterialValue}
                      onChange={(e) => setEditingMaterialValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleMaterialRenameSave()
                        if (e.key === 'Escape') cancelEditMaterial()
                      }}
                      style={editInput}
                      disabled={materialLoading}
                    />
                    <button
                      onClick={handleMaterialRenameSave}
                      disabled={materialLoading || !editingMaterialValue.trim()}
                      style={saveBtn}
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEditMaterial}
                      disabled={materialLoading}
                      style={cancelBtn}
                    >
                      キャンセル
                    </button>
                  </div>
                ) : deleteMaterialTarget === name ? (
                  <div style={deleteConfirmRow}>
                    <span style={deleteConfirmText}>「{name}」を削除しますか？</span>
                    <button
                      onClick={handleMaterialDeleteConfirm}
                      disabled={materialLoading}
                      style={destructiveBtn}
                    >
                      削除
                    </button>
                    <button
                      onClick={() => setDeleteMaterialTarget(null)}
                      disabled={materialLoading}
                      style={cancelBtn}
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div style={itemRow}>
                    <span style={itemName}>{name}</span>
                    <div style={itemActions}>
                      <button onClick={() => startEditMaterial(name)} style={iconBtn}>
                        編集
                      </button>
                      <button
                        onClick={() => setDeleteMaterialTarget(name)}
                        style={{ ...iconBtn, color: c.red }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
                <div style={divider} />
              </div>
            ))}
            {materials.length === 0 && <p style={emptyText}>教材が登録されていません</p>}
          </div>
        </div>

        <button style={logoutBtn} onClick={handleLogout}>
          ログアウト
        </button>
      </div>
    </div>
  )
}

// ── Styles (一部追加・修正) ──────────────────────────────────────────────

const pageWrapper: React.CSSProperties = {
  backgroundColor: c.bg,
  minHeight: '100vh',
  color: c.text,
}
const content: React.CSSProperties = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '48px 20px 120px',
}
const avatarWrap: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '32px',
}
const avatar: React.CSSProperties = {
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  backgroundColor: '#2383e2',
  color: '#fff',
  fontSize: '28px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const card: React.CSSProperties = {
  border: `1px solid rgba(55, 53, 47, 0.09)`,
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '32px',
}
const row: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '16px 20px',
}
const divider: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'rgba(55, 53, 47, 0.06)',
  margin: '8px 0',
}
const label: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55, 53, 47, 0.3)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}
const value: React.CSSProperties = { fontSize: font.base, color: c.text, fontWeight: 500 }

const sectionHeadingWrap: React.CSSProperties = { marginBottom: '12px' }
const sectionHeading: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55, 53, 47, 0.3)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const settingsBlock: React.CSSProperties = {
  border: `1px solid rgba(55, 53, 47, 0.09)`,
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '16px',
  backgroundColor: '#fff',
}
const settingsSubLabel: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  marginBottom: '6px',
  color: c.text,
}
const settingsNote: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(55, 53, 47, 0.45)',
  marginBottom: '16px',
  lineHeight: 1.6,
}
const errorText: React.CSSProperties = { fontSize: '12px', color: c.red, marginBottom: '12px' }

const formStack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' }
const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' }
const fieldRow: React.CSSProperties = { display: 'flex', gap: '12px' }
const inputLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgba(55, 53, 47, 0.6)',
}

const textInput: React.CSSProperties = {
  border: `1px solid rgba(55, 53, 47, 0.12)`,
  borderRadius: '4px',
  padding: '8px 10px',
  fontSize: font.base,
  color: c.text,
  outline: 'none',
  backgroundColor: 'rgba(55, 53, 47, 0.02)',
  width: '100%',
  boxSizing: 'border-box',
}
const textArea: React.CSSProperties = {
  border: `1px solid rgba(55, 53, 47, 0.12)`,
  borderRadius: '4px',
  padding: '8px 10px',
  fontSize: font.base,
  color: c.text,
  outline: 'none',
  backgroundColor: 'rgba(55, 53, 47, 0.02)',
  resize: 'none',
  height: '100px',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
}

const itemList: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const itemRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 0',
}
const itemName: React.CSSProperties = { fontSize: font.base, fontWeight: 600, color: c.text }
const itemActions: React.CSSProperties = { display: 'flex', gap: '8px' }
const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgba(55, 53, 47, 0.45)',
  cursor: 'pointer',
  padding: '2px 6px',
}

const editRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 0',
}
const editInput: React.CSSProperties = {
  flex: 1,
  border: `1px solid rgba(55, 53, 47, 0.2)`,
  borderRadius: '4px',
  padding: '6px 8px',
  fontSize: font.base,
  color: c.text,
  outline: 'none',
  backgroundColor: 'rgba(55, 53, 47, 0.02)',
}

const deleteConfirmRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 0',
}
const deleteConfirmText: React.CSSProperties = {
  flex: 1,
  fontSize: '12px',
  color: c.red,
  fontWeight: 500,
}

const saveBtn: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#2383e2',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}
const cancelBtn: React.CSSProperties = {
  padding: '4px 10px',
  backgroundColor: 'transparent',
  border: `1px solid rgba(55, 53, 47, 0.16)`,
  borderRadius: '4px',
  fontSize: '11px',
  color: 'rgba(55, 53, 47, 0.6)',
  cursor: 'pointer',
  fontWeight: 500,
}
const destructiveBtn: React.CSSProperties = {
  padding: '4px 10px',
  backgroundColor: c.red,
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
}

const emptyText: React.CSSProperties = {
  fontSize: font.base,
  color: 'rgba(55, 53, 47, 0.35)',
  padding: '12px 0',
}

const alertSaveRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const savedText: React.CSSProperties = { fontSize: '12px', color: '#0f9d58', fontWeight: 500 }

const logoutBtn: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: 'transparent',
  border: `1px solid rgba(55, 53, 47, 0.16)`,
  borderRadius: '6px',
  fontSize: font.sm,
  color: 'rgba(55, 53, 47, 0.6)',
  cursor: 'pointer',
  fontWeight: 500,
  marginTop: '16px',
}
