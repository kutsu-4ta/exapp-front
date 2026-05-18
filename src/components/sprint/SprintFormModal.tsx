import {useEffect, useState} from 'react'
import type {Sprint, SprintInput, SprintUpdateInput} from '../../types/sprint'
import {c, font, formInput, formLabel} from '../../styles/notion'

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
          startDate,
          endDate,
        })
      } else {
        const input: SprintUpdateInput = { name: name.trim() }
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{ margin: '0 0 16px', fontSize: font.md, fontWeight: 700, color: c.text }}
        >
          {mode === 'create' ? 'スプリント作成' : 'スプリント編集'}
        </h3>

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

          {!isBacklog && (
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={formLabel}>開始日</label>
                  <input
                    type="date"
                    style={{ ...formInput, marginTop: 4 }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={formLabel}>終了日</label>
                  <input
                    type="date"
                    style={{ ...formInput, marginTop: 4 }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
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

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: `1px solid rgba(55,53,47,0.16)`,
              borderRadius: '6px',
              fontSize: font.base,
              fontWeight: 600,
              color: c.textSub,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 16px',
              backgroundColor: saving ? 'rgba(35,131,226,0.5)' : c.blue,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: font.base,
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

