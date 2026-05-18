import {useEffect, useRef, useState} from 'react'
import {Pencil} from 'lucide-react'
import type {TicketNote} from '../../types/sprint'
import {createTicketNote, deleteTicketNote, fetchTicketNotes, updateTicketNote} from '../../lib/api/sprint'
import {c, font} from '../../styles/notion'
import {MarkdownContent} from '../common/MarkdownContent'

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
  return isToday ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`
}

export function TicketNotes({ ticketId }: Props) {
  const [notes, setNotes] = useState<TicketNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newBody, setNewBody] = useState('')
  const [newPreview, setNewPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editPreview, setEditPreview] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    setNotes([])
    fetchTicketNotes(ticketId)
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ticketId])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes.length, loading])

  const handleSubmit = async () => {
    const body = newBody.trim()
    if (!body || submitting) return
    setSubmitting(true)
    try {
      const note = await createTicketNote(ticketId, { body })
      setNotes((prev) => [...prev, note])
      setNewBody('')
      setNewPreview(false)
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
    setEditPreview(false)
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
      setEditPreview(false)
    }
  }

  const handleDelete = async (note: TicketNote) => {
    if (deletingId !== note.id) { setDeletingId(note.id); return }
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
        NOTE ({notes.length})
      </div>

      <div
        style={{
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {/* Notes list */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
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
                  padding: '10px 12px',
                  borderRadius: '6px',
                }}
              >
                {editingId === note.id ? (
                  /* ── Edit mode ── */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                      {editPreview ?
                      <button
                        onClick={() => setEditPreview((v) => !v)}
                        title={editPreview ? '編集' : 'プレビュー'}
                        style={{
                          ...iconBtn,
                          backgroundColor: 'transparent',
                          borderRadius: 4,
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                          :
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                            <button
                                onClick={() => handleDelete(note)}
                                style={{
                                  ...textBtn,
                                  color: deletingId === note.id ? c.red : c.textHint,
                                  fontWeight: deletingId === note.id ? 700 : 400,
                                }}
                            >
                              {deletingId === note.id ? 'confirm delete' : 'delete'}
                            </button>
                            <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => { setEditingId(null); setEditPreview(false); setDeletingId(null) }} style={cancelBtn}>
                              cancel
                            </button>
                            <button onClick={() => handleEditSave(note)} style={saveBtn}>
                              save
                            </button>
                            </div>
                          </div>
                      }
                    </div>

                    {editPreview ? (
                      <div style={previewBox}>
                        <MarkdownContent>{editBody || ' '}</MarkdownContent>
                      </div>
                    ) : (
                      <textarea
                        value={editBody}
                        onChange={(e) => {
                          setEditingId(note.id)
                          setEditBody(e.target.value)
                        }}
                        style={newTextarea}
                        autoFocus
                        rows={8}
                      />
                    )}
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div style={{ marginBottom: '6px', fontSize: font.base, lineHeight: 1.6 }}>
                      <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                        <button
                            onClick={() =>  startEdit(note)}
                            title={editPreview ? '編集' : 'プレビュー'}
                            style={{
                              ...iconBtn,
                              backgroundColor: !editPreview ? c.blueBg : 'transparent',
                              borderRadius: 4,
                            }}
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                      <MarkdownContent>{note.body}</MarkdownContent>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: font.xs, color: c.textHint }}>
                        {formatTime(note.createdAt)}
                        {note.updatedAt !== note.createdAt && ' (編集済)'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
          {/* ── New note input ── */}
          <div style={{ padding: '8px' }}>
            {newPreview ? (
                <div style={{ ...previewBox, minHeight: 60, marginBottom: 6 }}>
                  {newBody.trim() ? (
                      <MarkdownContent>{newBody}</MarkdownContent>
                  ) : (
                      <span style={{ color: c.textHint, fontSize: font.sm }}>プレビュー</span>
                  )}
                </div>
            ) : (
                <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ノートを追加..."
                    rows={2}
                    style={newTextarea}
                />
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              {newPreview ?
                  <button
                  onClick={handleSubmit}
                  disabled={!newBody.trim() || submitting}
                  style={{
                    padding: '7px 14px',
                    backgroundColor: newBody.trim() && !submitting ? c.blue : 'rgba(55,53,47,0.08)',
                    color: newBody.trim() && !submitting ? '#fff' : c.textHint,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: font.sm,
                    fontWeight: 700,
                    cursor: newBody.trim() && !submitting ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}
              >
                add
              </button>
                  :

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <button
                    onClick={() => setNewPreview((v) => !v)}
                    title={newPreview ? '編集' : 'プレビュー'}
                    style={{
                      ...iconBtn,
                      backgroundColor: !newPreview ? 'rgba(35,131,226,0.08)' : 'transparent',
                      borderRadius: 4,
                    }}
                >
                  <Pencil size={14} />
                </button>
              </div>
              }



            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: c.blue,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: '3px 5px',
}

const textBtn: React.CSSProperties = {
  padding: '2px 6px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: font.xs,
  color: c.textHint,
}

const cancelBtn: React.CSSProperties = {
  padding: '4px 10px',
  border: `1px solid rgba(55,53,47,0.16)`,
  borderRadius: '4px',
  fontSize: font.xs,
  color: c.textSub,
  background: 'transparent',
  cursor: 'pointer',
}

const saveBtn: React.CSSProperties = {
  padding: '4px 10px',
  border: 'none',
  borderRadius: '4px',
  fontSize: font.xs,
  color: '#fff',
  backgroundColor: c.blue,
  cursor: 'pointer',
  fontWeight: 600,
}

const newTextarea: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  fontSize: font.base,
  border: `1px solid rgba(55,53,47,0.12)`,
  borderRadius: '6px',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'monospace',
  color: c.text,
  backgroundColor: '#fff',
  lineHeight: 1.6,
}

const previewBox: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  backgroundColor: 'rgba(55,53,47,0.02)',
  fontSize: font.base,
  lineHeight: 1.6,
}
