import {useEffect, useRef, useState} from 'react'
import {
  loadSnippets,
  MAX_CONTENT,
  MAX_SLOTS,
  MAX_TITLE,
  newSnippetId,
  saveSnippets,
  type Snippet,
} from '../../lib/snippetStore'

type Props = {
  open: boolean
  onClose: () => void
  topbarHeight: number
}

type FormState = { title: string; content: string; editingId: string | null }

const FORM_INIT: FormState = { title: '', content: '', editingId: null }

export function SnippetPanel({ open, onClose, topbarHeight }: Props) {
  const [snippets, setSnippets] = useState<Snippet[]>(() => loadSnippets())
  const [editMode, setEditMode] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_INIT)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const swipeStartY = useRef<number>(0)

  useEffect(() => {
    if (!open) {
      setFormOpen(false)
      setEditMode(false)
      setForm(FORM_INIT)
    }
  }, [open])

  const persist = (next: Snippet[]) => {
    setSnippets(next)
    saveSnippets(next)
  }

  const openAddForm = () => {
    setForm(FORM_INIT)
    setFormOpen(true)
  }

  const openEditForm = (s: Snippet) => {
    setForm({ title: s.title, content: s.content, editingId: s.id })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setForm(FORM_INIT)
  }

  const handleSave = () => {
    const title = form.title.trim()
    const content = form.content.trim()
    if (!title || !content) return

    if (form.editingId) {
      persist(
        snippets.map((s) =>
          s.id === form.editingId ? { ...s, title, content } : s
        )
      )
    } else {
      if (snippets.length >= MAX_SLOTS) return
      persist([...snippets, { id: newSnippetId(), title, content }])
    }
    closeForm()
  }

  const handleDelete = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    persist(snippets.filter((s) => s.id !== id))
    if (form.editingId === id) closeForm()
  }

  const handleRowTap = async (s: Snippet) => {
    if (editMode) {
      openEditForm(s)
      return
    }
    try {
      await navigator.clipboard.writeText(s.content)
      setCopiedId(s.id)
      setTimeout(() => setCopiedId(null), 1200)
    } catch {}
  }

  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0].clientY
  }
  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - swipeStartY.current < -60) onClose()
  }

  const canAdd = snippets.length < MAX_SLOTS && !editMode

  return (
    <>
      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: topbarHeight,
          left: 0,
          right: 0,
          zIndex: 999,
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          transform: open ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: open ? 'auto' : 'none',
          maxHeight: '72vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerLabel}>
            SNIPPETS&nbsp;&nbsp;
            <span style={{ color: snippets.length >= MAX_SLOTS ? 'rgba(235,87,87,0.8)' : 'rgba(55,53,47,0.3)', fontWeight: 500 }}>
              {snippets.length}/{MAX_SLOTS}
            </span>
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {snippets.length > 0 && (
              <button
                onClick={() => { setEditMode((e) => !e); closeForm() }}
                style={{
                  ...styles.textBtn,
                  color: editMode ? '#2383e2' : 'rgba(55,53,47,0.45)',
                }}
              >
                {editMode ? '完了' : '編集'}
              </button>
            )}
            {canAdd && (
              <button
                onClick={formOpen && !form.editingId ? closeForm : openAddForm}
                style={{
                  ...styles.iconBtn,
                  backgroundColor: formOpen && !form.editingId
                    ? 'rgba(55,53,47,0.08)'
                    : 'rgba(35,131,226,0.1)',
                  color: formOpen && !form.editingId ? 'rgba(55,53,47,0.5)' : '#2383e2',
                }}
                aria-label={formOpen && !form.editingId ? '閉じる' : 'スニペットを追加'}
              >
                {formOpen && !form.editingId ? '×' : '+'}
              </button>
            )}
          </div>
        </div>

        {/* Inline form */}
        {formOpen && (
          <div style={styles.formArea}>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value.slice(0, MAX_TITLE) }))
              }
              placeholder="タイトル"
              style={styles.input}
              autoFocus
              maxLength={MAX_TITLE}
            />
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value.slice(0, MAX_CONTENT) }))
              }
              placeholder="スニペットのテキスト"
              style={styles.textarea}
              rows={5}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'rgba(55,53,47,0.3)' }}>
                {form.content.length.toLocaleString()}/{MAX_CONTENT.toLocaleString()}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={closeForm} style={styles.cancelBtn}>キャンセル</button>
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim() || !form.content.trim()}
                  style={{
                    ...styles.saveBtn,
                    opacity: !form.title.trim() || !form.content.trim() ? 0.45 : 1,
                  }}
                >
                  {form.editingId ? '保存' : '登録'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {snippets.length === 0 && !formOpen ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 13, color: 'rgba(55,53,47,0.35)' }}>
                スニペットがありません
              </span>
              <span style={{ fontSize: 12, color: 'rgba(55,53,47,0.25)', marginTop: 4 }}>
                ＋ から登録してください
              </span>
            </div>
          ) : (
            snippets.map((s) => {
              const isCopied = copiedId === s.id
              const isEditing = form.editingId === s.id && formOpen
              return (
                <div
                  key={s.id}
                  onClick={() => handleRowTap(s)}
                  style={{
                    ...styles.row,
                    backgroundColor: isCopied
                      ? 'rgba(39,174,96,0.07)'
                      : isEditing
                        ? 'rgba(35,131,226,0.05)'
                        : 'transparent',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        ...styles.rowTitle,
                        color: isCopied ? '#27ae60' : isEditing ? '#2383e2' : '#37352f',
                      }}
                    >
                      {isCopied ? '✓  コピー済み' : s.title}
                    </div>
                    {!isCopied && (
                      <div style={styles.rowPreview}>{s.content}</div>
                    )}
                  </div>
                  {editMode && (
                    <button
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => handleDelete(s.id, e)}
                      style={styles.deleteBtn}
                      aria-label="削除"
                    >
                      ×
                    </button>
                  )}
                  {!editMode && !isCopied && (
                    <div style={styles.copyHint}>コピー</div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Swipe handle */}
        <div
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
          style={styles.handle}
        >
          <div style={styles.handleBar} />
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          onClick={onClose}
        />
      )}
    </>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 10px',
    borderBottom: '1px solid rgba(55,53,47,0.06)',
  } as React.CSSProperties,

  headerLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(55,53,47,0.5)',
    letterSpacing: '0.08em',
  } as React.CSSProperties,

  textBtn: {
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
  } as React.CSSProperties,

  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
  } as React.CSSProperties,

  formArea: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(55,53,47,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid rgba(55,53,47,0.14)',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#37352f',
    backgroundColor: '#fff',
  } as React.CSSProperties,

  textarea: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid rgba(55,53,47,0.14)',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#37352f',
    backgroundColor: '#fff',
    resize: 'none',
    lineHeight: 1.6,
  } as React.CSSProperties,

  cancelBtn: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(55,53,47,0.5)',
    border: '1px solid rgba(55,53,47,0.12)',
    borderRadius: 7,
    background: 'transparent',
    cursor: 'pointer',
  } as React.CSSProperties,

  saveBtn: {
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#2383e2',
    border: 'none',
    borderRadius: 7,
    cursor: 'pointer',
  } as React.CSSProperties,

  emptyState: {
    padding: '36px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  } as React.CSSProperties,

  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(55,53,47,0.05)',
    transition: 'background 0.15s',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  } as React.CSSProperties,

  rowTitle: {
    fontSize: 13,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 2,
    transition: 'color 0.2s',
  } as React.CSSProperties,

  rowPreview: {
    fontSize: 11,
    color: 'rgba(55,53,47,0.4)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: 'rgba(235,87,87,0.12)',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(235,87,87,0.9)',
    fontSize: 15,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    lineHeight: 1,
  } as React.CSSProperties,

  copyHint: {
    fontSize: 10,
    color: 'rgba(55,53,47,0.25)',
    fontWeight: 600,
    flexShrink: 0,
    letterSpacing: '0.03em',
  } as React.CSSProperties,

  handle: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 14,
    cursor: 'grab',
  } as React.CSSProperties,

  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(55,53,47,0.12)',
  } as React.CSSProperties,
}
