import {useEffect, useState} from 'react'
import {getCached, setCached} from '../../lib/pageCache'
import {fetchUserProfile, updateUserProfile} from '../../lib/api/profile'
import {c, font} from '../../styles/notion'

export function ProfileInfoSection() {
  const [nickname, setNickname] = useState('')
  const [occupation, setOccupation] = useState('')
  const [goal, setGoal] = useState('')
  const [weakAreas, setWeakAreas] = useState('')
  const [strongAreas, setStrongAreas] = useState('')
  const [interests, setInterests] = useState('')
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    type Cache = { nickname: string; occupation: string; goal: string; weakAreas: string; strongAreas: string; interests: string; geminiTokenSet: boolean }
    const apply = (d: Cache) => {
      setNickname(d.nickname)
      setOccupation(d.occupation)
      setGoal(d.goal)
      setWeakAreas(d.weakAreas)
      setStrongAreas(d.strongAreas)
      setInterests(d.interests)
    }
    const cached = getCached<Cache>('profile-data')
    if (cached) { apply(cached); setLoading(false) }
    fetchUserProfile()
      .then((data) => {
        if (data) {
          const entry: Cache = {
            nickname: data.nickname || '', occupation: data.occupation || '',
            goal: data.goal || '', weakAreas: data.weakAreas || '',
            strongAreas: data.strongAreas || '', interests: data.interests || '',
            geminiTokenSet: data.geminiTokenSet,
          }
          apply(entry)
          setCached('profile-data', entry)
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : '読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      await updateUserProfile({ nickname, occupation, goal, weakAreas, strongAreas, interests })
      const existing = getCached<{ geminiTokenSet?: boolean }>('profile-data')
      setCached('profile-data', { nickname, occupation, goal, weakAreas, strongAreas, interests, geminiTokenSet: existing?.geminiTokenSet ?? false })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={block}>
      <p style={note}>ここで入力した内容は、AIエージェントのアドバイスを最適化するために使用されます。</p>
      {error && <p style={errorText}>{error}</p>}
      <div style={formStack}>
        <FormField label="ニックネーム">
          <input style={textInput} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="例：タロウ" />
        </FormField>
        <FormField label="現在の職業">
          <input style={textInput} value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="例：ITエンジニア、製造業など" />
        </FormField>
        <FormField label="試験の合格目標・ミッション">
          <textarea style={textArea} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="例：2026年の一発合格を目指しています。" />
        </FormField>
        <div style={fieldRow}>
          <div style={{ flex: 1 }}>
            <FormField label="得意な領域">
              <textarea style={{ ...textArea, height: '80px' }} value={strongAreas} onChange={(e) => setStrongAreas(e.target.value)} placeholder="マーケ、財務" />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="苦手な領域">
              <textarea style={{ ...textArea, height: '80px' }} value={weakAreas} onChange={(e) => setWeakAreas(e.target.value)} placeholder="法務、経済" />
            </FormField>
          </div>
        </div>
        <FormField label="興味・趣味">
          <input style={textInput} value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="例：物理学、哲学、サッカー" />
        </FormField>
        <div style={saveRow}>
          <button onClick={handleSave} disabled={loading} style={saveBtn}>
            {loading ? '保存中...' : 'プロフィールを更新'}
          </button>
          {saved && <span style={savedText}>保存しました</span>}
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={inputLabel}>{label}</label>
      {children}
    </div>
  )
}

const block: React.CSSProperties = { border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px', backgroundColor: '#fff' }
const note: React.CSSProperties = { fontSize: '11px', color: 'rgba(55,53,47,0.45)', marginBottom: '16px', lineHeight: 1.6 }
const errorText: React.CSSProperties = { fontSize: '12px', color: c.red, marginBottom: '12px' }
const formStack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' }
const fieldRow: React.CSSProperties = { display: 'flex', gap: '12px' }
const inputLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)' }
const textInput: React.CSSProperties = { border: '1px solid rgba(55,53,47,0.12)', borderRadius: '4px', padding: '8px 10px', fontSize: font.base, color: c.text, outline: 'none', backgroundColor: 'rgba(55,53,47,0.02)', width: '100%', boxSizing: 'border-box' }
const textArea: React.CSSProperties = { border: '1px solid rgba(55,53,47,0.12)', borderRadius: '4px', padding: '8px 10px', fontSize: font.base, color: c.text, outline: 'none', backgroundColor: 'rgba(55,53,47,0.02)', resize: 'none', height: '100px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const saveRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const saveBtn: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const savedText: React.CSSProperties = { fontSize: '12px', color: '#0f9d58', fontWeight: 500 }
