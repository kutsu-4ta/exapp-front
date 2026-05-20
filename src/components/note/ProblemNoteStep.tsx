import {useEffect, useRef, useState} from 'react'
import type {Problem} from '../../types/workspace'
import {Pencil} from 'lucide-react'
import {c, font} from '../../styles/notion'
import {MarkdownContent} from '@/components/common/MarkdownContent'
import {useSettingsStore} from '@/lib/store/settings'
import {subjectPalette} from '@/styles/subjectUI'
import {BottomSheet, sheetFlexHeaderStyle} from '@/components/common/BottomSheet'
import {NoteEditor} from './NoteEditor'

type Props = {
  problem: Problem
  onAutoSave: (note: string) => Promise<void>
  onClose: () => void
}

export function ProblemNoteStep({problem, onAutoSave, onClose}: Props) {
  const subjectColors = useSettingsStore((s) => s.subjectColors)
  const [note, setNote] = useState(problem.note ?? '')
  const [preview, setPreview] = useState(false)
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const successTimerRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
      window.clearTimeout(timerRef.current ?? 0)
      window.clearTimeout(successTimerRef.current ?? 0)
    }
  }, [])

  function scheduleSave(value: string) {
    setSaveSuccessVisible(false)
    setIsSaving(true)
    window.clearTimeout(timerRef.current ?? 0)
    timerRef.current = window.setTimeout(async () => {
      try {
        await onAutoSave(value)
        window.clearTimeout(successTimerRef.current ?? 0)
        setSaveSuccessVisible(true)
        successTimerRef.current = window.setTimeout(() => setSaveSuccessVisible(false), 3000)
      } finally {
        setIsSaving(false)
      }
    }, 500)
  }

  return (
    <BottomSheet onClose={onClose} height="90vh">
      <div style={sheetFlexHeaderStyle}>
        <button onClick={onClose} disabled={isSaving} style={{...closeBtn, opacity: isSaving ? 0.7 : 1}}>
          ×
        </button>
        <div style={headerRight}>
          {(isSaving || saveSuccessVisible) && (
            <span style={isSaving ? saveLabelSaving : saveLabelSuccess}>
              {isSaving ? '保存中…' : '自動保存済み'}
            </span>
          )}
          <button
            style={{...iconBtn, background: !preview ? '#eef5ff' : 'none', borderRadius: '6px'}}
            onClick={() => setPreview((v) => !v)}
            title={preview ? '編集' : 'プレビュー'}
          >
            <Pencil size={18} />
          </button>
        </div>
      </div>

      <div style={body}>
        <div style={metaRow}>
          <span
            style={{
              ...subjectTag,
              background: subjectPalette(problem.subject, subjectColors[problem.subject]).bg,
              color: subjectPalette(problem.subject, subjectColors[problem.subject]).color,
            }}
          >
            {problem.subject}
          </span>
          <span style={subCatTag}>
            {problem.materialName} {problem.questionRef}
          </span>
        </div>

        {problem.subCategory && <p style={questionRefStyle}>{problem.subCategory}</p>}

        <div style={section}>
          {!preview && <p style={sectionLbl}>ノート</p>}
          {preview ? (
            <div style={markdownPreview}>
              <MarkdownContent>{note}</MarkdownContent>
            </div>
          ) : (
            <NoteEditor
              value={note}
              onChange={(v) => { setNote(v); scheduleSave(v) }}
              onBlur={() => scheduleSave(note)}
              minHeight="320px"
            />
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

const closeBtn: React.CSSProperties = {border: 'none', background: 'none', fontSize: '20px', color: 'rgba(55,53,47,0.4)', cursor: 'pointer', lineHeight: 1, padding: '0 2px'}
const headerRight: React.CSSProperties = {display: 'flex', alignItems: 'center', gap: '12px'}
const iconBtn: React.CSSProperties = {border: 'none', background: 'none', color: c.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px'}
const saveLabelSuccess: React.CSSProperties = {fontSize: '12px', color: '#19a576'}
const saveLabelSaving: React.CSSProperties = {fontSize: '12px', color: c.textHint}
const body: React.CSSProperties = {padding: '12px 16px 20px', overflowY: 'auto', flex: 1}
const metaRow: React.CSSProperties = {display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px'}
const subjectTag: React.CSSProperties = {padding: '3px 8px', borderRadius: '6px', fontSize: font.sm, fontWeight: 600}
const subCatTag: React.CSSProperties = {padding: '3px 8px', borderRadius: '6px', background: '#f6f6f6', color: c.textSub, fontSize: font.sm}
const questionRefStyle: React.CSSProperties = {fontSize: '16px', fontWeight: 600, margin: '0 0 10px', color: c.text}
const section: React.CSSProperties = {marginBottom: '20px'}
const sectionLbl: React.CSSProperties = {fontSize: '11px', fontWeight: 700, color: c.textHint, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 6px'}
const markdownPreview: React.CSSProperties = {padding: '12px', borderRadius: '8px', border: `1px solid ${c.border}`, minHeight: '200px', fontSize: '15px', lineHeight: 1.7}
