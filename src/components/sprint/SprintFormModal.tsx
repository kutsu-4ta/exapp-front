import {useEffect, useState} from 'react'
import type {Sprint, SprintInput, SprintUpdateInput} from '../../types/sprint'
import {c, font, formInput, formLabel, formTextarea} from '../../styles/notion'

type Props =
  | { mode: 'create'; onSave: (input: SprintInput) => Promise<void>; onClose: () => void }
  | {
      mode: 'edit'
      sprint: Sprint
      onSave: (input: SprintUpdateInput) => Promise<void>
      onClose: () => void
    }

export function SprintFormModal(props: Props) {
  const { mode, onSave, onClose } = props
  const sprint = mode === 'edit' ? props.sprint : null
  const isBacklog = sprint?.type === 'backlog'

  const [name, setName] = useState(sprint?.name ?? '')
  const [goal, setGoal] = useState(sprint?.goal ?? '')
  const [startDate, setStartDate] = useState(sprint?.startDate ?? '')
  const [endDate, setEndDate] = useState(sprint?.endDate ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (mode === 'create' && !startDate) {
      setStartDate(today)
      const end = new Date()
      end.setDate(end.getDate() + 14)
      setEndDate(end.toISOString().slice(0, 10))
    }
  }, [])

  const validate = (): string => {
    if (!name.trim()) return 'スプリント名は必須です'
    if (!isBacklog) {
      if (mode === 'create' || !isBacklog) {
        if (!startDate) return '開始日は必須です'
        if (!endDate) return '終了日は必須です'
        if (endDate <= startDate) return '終了日は開始日より後にしてください'
      }
    }
    return ''
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    setError('')
    try {
      if (mode === 'create') {
        await (onSave as (input: SprintInput) => Promise<void>)({
          name: name.trim(),
          goal: goal.trim() || undefined,
          startDate,
          endDate,
        })
      } else {
        const input: SprintUpdateInput = { name: name.trim(), goal: goal.trim() || undefined }
        if (!isBacklog) {
          if (startDate) input.startDate = startDate
          if (endDate) input.endDate = endDate
        }
        await (onSave as (input: SprintUpdateInput) => Promise<void>)(input)
      }
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#fff',
          borderRadius: '16px 16px 0 0',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          backgroundColor: 'rgba(55,53,47,0.1)',
          margin: '-8px auto 16px',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: font.md, fontWeight: 700, color: c.text }}>
            {mode === 'create' ? 'スプリント作成' : 'スプリント編集'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'rgba(55,53,47,0.4)', lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={formLabel}>スプリント名</label>
            <input
              style={{ ...formInput, marginTop: 4 }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 第1回スプリント"
              maxLength={100}
            />
          </div>

          <div>
            <label style={formLabel}>ゴール・テーマ（任意）</label>
            <textarea
              style={{ ...formTextarea, marginTop: 4, minHeight: 72, resize: 'vertical' }}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例: 財務・会計の弱点を潰す"
              maxLength={500}
            />
          </div>

          {!isBacklog && (
            <>
              <div>
                <label style={formLabel}>開始日</label>
                <input
                  type="date"
                  style={{ ...formInput, marginTop: 4 }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label style={formLabel}>終了日</label>
                <input
                  type="date"
                  style={{ ...formInput, marginTop: 4 }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          {isBacklog && (
            <p style={{ margin: 0, fontSize: font.sm, color: c.textHint }}>
              バックログは名前のみ変更できます
            </p>
          )}

          {error && (
            <p style={{ margin: 0, fontSize: '12px', color: c.red }}>{error}</p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '12px',
            backgroundColor: saving ? 'rgba(35,131,226,0.5)' : c.blue,
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: font.base,
            fontWeight: 700,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}

