import {c, font} from '@/styles/notion.ts'
import type {Rank} from '../../types/exam'

export const rankColors: Record<Rank, React.CSSProperties> = {
  A: { background: '#e1f0ff', color: '#2383e2' },
  B: { background: '#e6f6eb', color: '#19a576' },
  C: { background: '#fff5e0', color: '#f2ab26' },
  D: { background: '#ffebe9', color: '#eb5757' },
  E: { background: '#f3f3f2', color: '#8a7b6e' },
}

export const questionItem: React.CSSProperties = { display: 'flex', alignItems: 'flex-start' }

export const parentStyle: React.CSSProperties = {
  padding: '14px 12px',
  borderRadius: '10px',
  border: `1px solid ${c.border}`,
  backgroundColor: '#fff',
  marginTop: '10px',
}

export const subStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '0 8px 8px 0',
  backgroundColor: c.surface,
  marginTop: '2px',
  marginLeft: '12px',
  borderBottom: `1px solid ${c.border}`,
}

export const sideControl: React.CSSProperties = {
  width: '44px',
  marginRight: '8px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignSelf: 'stretch',
}

export const sideBtn: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  border: `1px dashed ${c.border}`,
  backgroundColor: 'transparent',
  color: c.textSub,
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
}

export const layoutContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

export const qNumberHeader: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '6px',
  width: '100%',
}

export const questionTypeToggle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
}

export const questionTypeBtn: React.CSSProperties = {
  padding: '3px 10px',
  fontSize: font.xs,
  fontWeight: 600,
  borderRadius: '4px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  color: c.textSub,
  cursor: 'pointer',
}

export const questionTypeActive: React.CSSProperties = {
  background: c.text,
  color: '#fff',
  border: `1px solid ${c.text}`,
}

export const controlsContent: React.CSSProperties = { width: '100%' }

export const qNumberParent: React.CSSProperties = {
  fontWeight: 900,
  fontSize: font.sm,
  color: c.text,
}

export const qNumberSub: React.CSSProperties = {
  fontWeight: 700,
  fontSize: font.xs,
  color: c.textSub,
}

export const addSubQBtn: React.CSSProperties = {
  marginLeft: 'auto',
  padding: '3px 10px',
  fontSize: font.xs,
  fontWeight: 600,
  borderRadius: '4px',
  border: `1px dashed ${c.border}`,
  background: 'transparent',
  color: c.textSub,
  cursor: 'pointer',
}

export const answerGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

export const typeToggleRow: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  alignItems: 'center',
}

export const typeToggleColumn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginLeft: '8px',
  paddingTop: '2px',
  flexShrink: 0,
}

export const typeToggleBtn: React.CSSProperties = {
  padding: '3px 10px',
  fontSize: font.xs,
  fontWeight: 600,
  borderRadius: '4px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  color: c.textSub,
  cursor: 'pointer',
}

export const typeToggleActive: React.CSSProperties = {
  background: c.text,
  color: '#fff',
  border: `1px solid ${c.text}`,
}

export const optionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

export const optionLineRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

export const optionRightGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flex: 1,
  minWidth: 0,
}

export const optionBtn: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  background: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: font.sm,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const optionActive: React.CSSProperties = {
  background: c.text,
  color: '#fff',
  border: `1px solid ${c.text}`,
}

export const optionExcluded: React.CSSProperties = { opacity: 0.45 }

export const excludeBtn: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '4px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  cursor: 'pointer',
  color: c.textSub,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

export const excludeBtnActive: React.CSSProperties = {
  border: `1px solid ${c.red}`,
  color: c.red,
  background: 'rgba(235,87,87,0.06)',
}

export const optionMemoInput: React.CSSProperties = {
  flex: 1,
  height: '30px',
  padding: '4px 8px',
  borderRadius: '4px',
  border: `1px solid ${c.border}`,
  fontSize: font.xs,
  boxSizing: 'border-box',
  background: '#fff',
  minWidth: 0,
  outline: 'none',
  fontFamily: 'inherit',
}

export const alphabetToggleBtn: React.CSSProperties = {
  marginLeft: 'auto',
  padding: '3px 8px',
  fontSize: font.xs,
  fontWeight: 600,
  borderRadius: '4px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  cursor: 'pointer',
  color: c.textSub,
  whiteSpace: 'nowrap',
  letterSpacing: '0.02em',
}

export const alphabetToggleBtnActive: React.CSSProperties = {
  border: `1px solid #6366f1`,
  color: '#6366f1',
  background: 'rgba(99,102,241,0.06)',
}

export const alphabetToggleBtnDisabled: React.CSSProperties = {
  opacity: 0.3,
  cursor: 'default',
}

export const doubtRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  paddingTop: '2px',
}

export const generalMemoTextarea: React.CSSProperties = {
  flex: 1,
  minHeight: '34px',
  padding: '6px 8px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  fontSize: font.sm,
  resize: 'vertical',
  boxSizing: 'border-box',
  background: '#fff',
  lineHeight: 1.5,
  fontFamily: 'inherit',
}

export const memoTextarea: React.CSSProperties = {
  width: '100%',
  minHeight: '52px',
  padding: '8px 10px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  fontSize: font.sm,
  resize: 'vertical',
  boxSizing: 'border-box',
  background: '#fff',
  fontFamily: 'inherit',
}

export const descriptiveRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
}

export const descriptiveTextarea: React.CSSProperties = {
  flex: 1,
  minHeight: '72px',
  padding: '10px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  fontSize: font.base,
  resize: 'vertical',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  lineHeight: 1.5,
}

export const doubtBtn: React.CSSProperties = {
  marginLeft: 'auto',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: '4px',
  flexShrink: 0,
}

export const doubtBtnInline: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: '4px',
  flexShrink: 0,
}

export const scoringGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

export const scoringRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

export const myAnswerDisplay: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 800,
  color: c.text,
  backgroundColor: c.surface,
  padding: '4px 8px',
  borderRadius: '4px',
  minWidth: '30px',
  textAlign: 'center',
  border: `1px solid ${c.border}`,
}

export const scoringBtnGroup: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginLeft: 'auto',
}

export const statusBtn: React.CSSProperties = {
  width: '40px',
  height: '30px',
  border: `1px solid ${c.border}`,
  borderRadius: '6px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: font.base,
  fontWeight: 800,
}

export const activeCorrect: React.CSSProperties = {
  backgroundColor: c.blue,
  color: '#fff',
  borderColor: c.blue,
}

export const activeIncorrect: React.CSSProperties = {
  backgroundColor: c.red,
  color: '#fff',
  borderColor: c.red,
}

export const scoringMeta: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  paddingTop: '8px',
  borderTop: `1px dashed ${c.border}`,
}

export const metaGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

export const miniLabel: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  color: c.textFaint,
  letterSpacing: '0.05em',
}

export const rankBadge: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '5px',
  border: 'none',
  fontSize: font.xs,
  fontWeight: 900,
  cursor: 'pointer',
}

export const pointInput: React.CSSProperties = {
  width: '22px',
  border: 'none',
  fontSize: font.base,
  fontWeight: 900,
  textAlign: 'right',
  background: 'transparent',
}

export const timeValue: React.CSSProperties = {
  fontSize: font.sm,
  fontFamily: 'monospace',
  fontWeight: 700,
  color: c.textSub,
}

export const noteInput: React.CSSProperties = {
  width: '100%',
  marginTop: '8px',
  padding: '8px 10px',
  fontSize: font.sm,
  border: `1px solid ${c.border}`,
  borderRadius: '6px',
  backgroundColor: c.surface,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}
