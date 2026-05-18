import {useEffect, useRef, useState} from 'react'
import type {TicketNote} from '../../types/sprint'
import {createTicketNote, deleteTicketNote, fetchTicketNotes, updateTicketNote,} from '../../lib/api/sprint'
import {c, font} from '../../styles/notion'

type Props = {
  ticketId: number
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (isToday) return hm
  return `${d.getMonth() + 1}/${d.getDate()} ${hm}`
}

export function TicketNotes({ ticketId }: Props) {
  const [notes, setNotes] = useState<TicketNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newBody, setNewBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLoading(true)
    setNotes([])
    fetchTicketNotes(ticketId)
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ticketId])

  // Scroll to bottom when notes load or new note added
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [notes.length, loading])

  const handleSubmit = async () => {
    const body = newBody.trim()
    if (!body || submitting) return
    setSubmitting(true)
    try {
      const note = await createTicketNote(ticketId, { body })
      setNotes((prev) => [...prev, note])
      setNewBody('')
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const startEdit = (note: TicketNote) => {
    setEditingId(note.id)
    setEditBody(note.body)
  }

  const handleEditSave = async (note: TicketNote) => {
    const body = editBody.trim()
    if (!body) return
    try {
      const updated = await updateTicketNote(ticketId, note.id, { body })
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)))
    } catch {
      // silent
    } finally {
      setEditingId(null)
    }
  }

  const handleDelete = async (note: TicketNote) => {
    if (deletingId !== note.id) {
      setDeletingId(note.id)
      return
    }
    try {
      await deleteTicketNote(ticketId, note.id)
      setNotes((prev) => prev.filter((n) => n.id !== note.id))
    } catch {
      // silent
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {/* Section header */}
      <div
        style={{
          fontSize: font.xs,
          fontWeight: 700,
          color: c.textHint,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        ノート ({notes.length})
      </div>

      {/* Thread */}
      <div
        style={{
          borderRadius: '8px',
          border: `1px solid ${c.border}`,
          overflow: 'hidden',
          backgroundColor: 'rgba(55,53,47,0.01)',
        }}
      >
        {/* Notes list */}
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px' }}>
          {loading ? (
            <div style={{ padding: '16px 0', textAlign: 'center', fontSize: font.sm, color: c.textHint }}>
              読み込み中...
            </div>
          ) : notes.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: font.sm, color: c.textHint }}>
              ノートがありません
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                style={{
                  marginBottom: '6px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  border: `1px solid ${c.border}`,
                  position: 'relative',
                }}
              >
                {editingId === note.id ? (
                  /* Inline edit mode */
                  <div>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '6px',
                        fontSize: font.base,
                        border: `1px solid rgba(35,131,226,0.3)`,
                        borderRadius: '4px',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: 60,
                        fontFamily: 'inherit',
                        color: c.text,
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '4px 10px',
                          border: `1px solid rgba(55,53,47,0.16)`,
                          borderRadius: '4px',
                          fontSize: font.xs,
                          color: c.textSub,
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => handleEditSave(note)}
                        style={{
                          padding: '4px 10px',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: font.xs,
                          color: '#fff',
                          backgroundColor: c.blue,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <p
                      style={{
                        margin: '0 0 4px',
                        fontSize: font.base,
                        color: c.text,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {note.body}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: font.xs, color: c.textHint }}>
                        {formatTime(note.createdAt)}
                        {note.updatedAt !== note.createdAt && ' (編集済)'}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => startEdit(note)}
                          style={{
                            padding: '2px 6px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: font.xs,
                            color: c.textHint,
                          }}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(note)}
                          style={{
                            padding: '2px 6px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: font.xs,
                            color: deletingId === note.id ? c.red : c.textHint,
                            fontWeight: deletingId === note.id ? 700 : 400,
                          }}
                        >
                          {deletingId === note.id ? '確認削除' : '削除'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: c.border }} />

        {/* Input area */}
        <div style={{ padding: '8px', display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ノートを追加..."
            rows={2}
            style={{
              flex: 1,
              padding: '7px 10px',
              fontSize: font.base,
              border: `1px solid rgba(55,53,47,0.12)`,
              borderRadius: '6px',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              color: c.text,
              backgroundColor: '#fff',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!newBody.trim() || submitting}
            style={{
              padding: '8px 12px',
              backgroundColor: newBody.trim() && !submitting ? c.blue : 'rgba(55,53,47,0.08)',
              color: newBody.trim() && !submitting ? '#fff' : c.textHint,
              border: 'none',
              borderRadius: '6px',
              fontSize: font.sm,
              fontWeight: 700,
              cursor: newBody.trim() && !submitting ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  )
}
