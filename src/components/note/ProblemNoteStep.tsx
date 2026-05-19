import {useEffect, useRef, useState} from 'react'
import type {Problem} from '../../types/workspace'
import {Pencil} from "lucide-react";
import {c, font} from '../../styles/notion'
import {MarkdownContent} from '@/components/common/MarkdownContent'
import {useSettingsStore} from '@/lib/store/settings'
import {subjectPalette} from '@/styles/subjectUI'
import {BottomSheet, sheetFlexHeaderStyle} from '@/components/common/BottomSheet'

type Props = {
  problem: Problem
  onAutoSave: (note: string) => Promise<void>
  onClose: () => void
}

export function ProblemNoteStep({ problem, onAutoSave, onClose }: Props) {
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
        <button onClick={onClose} disabled={isSaving} style={{ ...closeBtn, opacity: isSaving ? 0.7 : 1 }}>
          ×
        </button>
        <div style={headerRight}>
          {(isSaving || saveSuccessVisible) && (
            <span style={isSaving ? saveLabelSaving : saveLabelSuccess}>
              {isSaving ? '保存中…' : '自動保存済み'}
            </span>
          )}
          <button style={{ ...iconBtn, background: !preview ? '#eef5ff' : 'none', borderRadius: '6px' }} onClick={() => setPreview((v) => !v)} title={!preview ? '編集終了' : '編集'}>
            <Pencil size={18} />
          </button>
        </div>
      </div>

      <div style={body}>
        <div style={metaRow}>
          <span style={{ ...subjectTag, background: subjectPalette(problem.subject, subjectColors[problem.subject]).bg, color: subjectPalette(problem.subject, subjectColors[problem.subject]).color }}>
            {problem.subject}
          </span>
          <span style={subCatTag}>{problem.materialName} {problem.questionRef}</span>
        </div>

        {problem.subCategory && <p style={questionRefStyle}>{problem.subCategory}</p>}

        <div style={section}>
          {!preview && <p style={sectionLbl}>ノート</p>}
          {preview ? (
            <div style={markdownPreview}>
              <MarkdownContent>{note}</MarkdownContent>
            </div>
          ) : (
            <textarea
              value={note}
              onChange={(e) => { const v = e.target.value; setNote(v); scheduleSave(v) }}
              onBlur={() => scheduleSave(note)}
              style={noteTextarea}
              placeholder="ノートをとる..."
            />
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

const closeBtn: React.CSSProperties = { border: 'none', background: 'none', fontSize: '20px', color: 'rgba(55,53,47,0.4)', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }
const headerRight: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const iconBtn: React.CSSProperties = { border: 'none', background: 'none', color: c.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }
const body: React.CSSProperties = { padding: '20px 16px', overflowY: 'auto', flex: 1 }
const metaRow: React.CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }
const subjectTag: React.CSSProperties = { padding: '4px 8px', borderRadius: '6px', background: '#eef5ff', color: c.blue, fontSize: font.sm }
const subCatTag: React.CSSProperties = { padding: '4px 8px', borderRadius: '6px', background: '#f6f6f6', color: c.textSub }
const questionRefStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 600, marginBottom: '20px' }
const section: React.CSSProperties = { marginBottom: '20px' }
const sectionLbl: React.CSSProperties = { fontSize: '12px', color: c.textSub, marginBottom: '8px' }
const noteTextarea: React.CSSProperties = { width: '100%', minHeight: '500px', padding: '12px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '15px', lineHeight: 1.7, resize: 'none' }
const markdownPreview: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: `1px solid ${c.border}`, minHeight: '500px', fontSize: '15px', lineHeight: 1.7 }
const saveLabelSuccess: React.CSSProperties = { fontSize: '12px', color: '#19a576' }
const saveLabelSaving: React.CSSProperties = { fontSize: '12px', color: '#19a576' }
