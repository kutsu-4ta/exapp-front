import {useEffect, useState} from 'react'
import type {Sprint, SprintInput, SprintUpdateInput} from '../../types/sprint'
import {c, font, formInput, formLabel, formTextarea} from '../../styles/notion'
import {BottomSheet, sheetCloseBtnStyle, sheetFlexHeaderStyle} from '@/components/common/BottomSheet'

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
    <BottomSheet onClose={onClose} zIndex={2000} maxWidth={480} maxHeight="92vh" paddingBottom="calc(20px + env(safe-area-inset-bottom))">
      <div style={sheetFlexHeaderStyle}>
        <h3 style={{ margin: 0, fontSize: font.md, fontWeight: 700, color: c.text }}>
          {mode === 'create' ? 'スプリント作成' : 'スプリント編集'}
        </h3>
        <button onClick={onClose} style={sheetCloseBtnStyle}>×</button>
      </div>

      <div style={{ padding: '16px 20px calc(20px + env(safe-area-inset-bottom))' }}>
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
    </BottomSheet>
  )
}

