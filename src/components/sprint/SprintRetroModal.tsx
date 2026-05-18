import {useRef, useState} from 'react'
import type {Sprint} from '../../types/sprint'
import {c, font, formTextarea} from '../../styles/notion'
import {MarkdownContent} from '../common/MarkdownContent'

type Props = {
  sprint: Sprint
  onSave: (retrospective: string) => Promise<void>
  onClose: () => void
}

export function SprintRetroModal({ sprint, onSave, onClose }: Props) {
  const [text, setText] = useState('')
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSave = async () => {
    if (!text.trim()) { setError('振り返りを入力してください'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(text.trim())
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
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
          maxWidth: '560px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: font.xs,
                fontWeight: 700,
                color: '#27ae60',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Sprint Complete
            </span>
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: font.md, fontWeight: 700, color: c.text }}>
            振り返り
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: font.sm, color: c.textHint }}>
            {sprint.name}
          </p>

          {/* Tab switcher */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderBottom: `1px solid ${c.border}`,
              marginBottom: 0,
            }}
          >
            {(['edit', 'preview'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  if (t === 'edit') setTimeout(() => textareaRef.current?.focus(), 0)
                }}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: font.sm,
                  fontWeight: tab === t ? 700 : 400,
                  color: tab === t ? c.blue : c.textHint,
                  borderBottom: tab === t ? `2px solid ${c.blue}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {t === 'edit' ? '編集' : 'プレビュー'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 20px', flex: 1, overflowY: 'auto', minHeight: 200 }}>
          {tab === 'edit' ? (
            <textarea
              ref={textareaRef}
              autoFocus
              style={{
                ...formTextarea,
                width: '100%',
                minHeight: 220,
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: font.sm,
              }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={'## よかったこと\n\n## 改善したいこと\n\n## 気づき\n\n### 次のスプリントに向けて'}
            />
          ) : text.trim() ? (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(55,53,47,0.02)',
                borderRadius: 8,
                border: `1px solid ${c.border}`,
                minHeight: 220,
              }}
            >
              <MarkdownContent>{text}</MarkdownContent>
            </div>
          ) : (
            <div
              style={{
                minHeight: 220,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: c.textHint,
                fontSize: font.sm,
              }}
            >
              編集タブでテキストを入力するとここにプレビューが表示されます
            </div>
          )}

          {error && (
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: c.red }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px 20px',
            borderTop: `1px solid ${c.border}`,
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
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
            disabled={saving || !text.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: saving || !text.trim() ? 'rgba(39,174,96,0.4)' : '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: font.base,
              fontWeight: 600,
              cursor: saving || !text.trim() ? 'default' : 'pointer',
            }}
          >
            {saving ? '完了処理中...' : 'スプリント完了'}
          </button>
        </div>
      </div>
    </div>
  )
}
