import {c, cardStyle, font} from '@/styles/notion.ts'

export const wrap: React.CSSProperties = { ...cardStyle, gap: '16px' }

export const parentHeader: React.CSSProperties = {
  fontSize: font.md,
  fontWeight: 800,
  color: c.text,
}

export const qLabel: React.CSSProperties = { fontWeight: 800 }

export const subBtnRow: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
}

export const addSubBtn: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: font.sm,
  borderRadius: '6px',
  border: `1px dashed ${c.border}`,
  background: 'transparent',
  cursor: 'pointer',
  color: c.textSub,
}

export const subRowOuter: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
}

export const sideControl: React.CSSProperties = {
  width: '28px',
  marginRight: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  paddingTop: '10px',
}

export const sideBtn: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '6px',
  border: `1px dashed ${c.border}`,
  backgroundColor: 'transparent',
  color: c.textSub,
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
}

export const block: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
}

export const qBlock: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  background: c.surface,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

export const subLabel: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 700,
  color: c.textSub,
}

// ── トグル行 ─────────────────────────────────────────────────────────────────

export const typeToggleRow: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  alignItems: 'center',
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

// ── 選択式 — 選択肢リスト ─────────────────────────────────────────────────────

export const optionLineRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
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

export const optionExcluded: React.CSSProperties = {
  opacity: 0.45,
}

export const optionDisabled: React.CSSProperties = { opacity: 0.3, cursor: 'default' }

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
}

// ── 疑問・記述行 ──────────────────────────────────────────────────────────────

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
}

export const doubtBtn: React.CSSProperties = {
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

export const descriptiveTextarea: React.CSSProperties = {
  flex: 1,
  minHeight: '80px',
  padding: '10px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  fontSize: font.base,
  resize: 'vertical',
  boxSizing: 'border-box',
}

// ── OK ボタン ────────────────────────────────────────────────────────────────

export const okBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: '8px',
  border: 'none',
  background: c.text,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: font.base,
}

// ── 確認フェーズ ──────────────────────────────────────────────────────────────

export const confirmRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

export const optionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

export const myAnswerText: React.CSSProperties = {
  flex: 1,
  fontSize: font.base,
  fontWeight: 500,
  color: c.text,
  whiteSpace: 'pre-wrap',
}

export const memoReviewBlock: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '8px 10px',
  borderRadius: '6px',
  background: 'rgba(55,53,47,0.03)',
  border: `1px solid rgba(55,53,47,0.06)`,
}

export const memoReviewItem: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'flex-start',
}

export const memoReviewLabel: React.CSSProperties = {
  fontSize: font.xs,
  fontWeight: 800,
  color: c.textSub,
  minWidth: '14px',
  marginTop: '1px',
}

export const memoReviewText: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
}

export const judgeRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginTop: '2px',
}

export const judgeBtn: React.CSSProperties = {
  width: '40px',
  height: '30px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  background: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: font.sm,
}

export const correctActive: React.CSSProperties = {
  background: c.blue,
  color: '#fff',
  border: `1px solid ${c.blue}`,
}

export const incorrectActive: React.CSSProperties = {
  background: c.red,
  color: '#fff',
  border: `1px solid ${c.red}`,
}

export const rankLabel: React.CSSProperties = {
  fontSize: font.xs,
  fontWeight: 700,
  color: c.textHint,
  marginLeft: '8px',
}

export const rankBtn: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: '4px',
  border: `1px solid ${c.border}`,
  background: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: font.sm,
}

export const confirmHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '4px',
}

export const backToEditBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: font.sm,
  fontWeight: 600,
  color: c.textSub,
  padding: '2px 0',
}

export const confirmActions: React.CSSProperties = { display: 'flex', gap: '8px' }

export const addProblemBtn: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  background: '#fff',
  color: c.text,
  fontWeight: 600,
  fontSize: font.sm,
  cursor: 'pointer',
}

export const nextBtn: React.CSSProperties = {
  flex: 2,
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  background: c.text,
  color: '#fff',
  fontWeight: 700,
  fontSize: font.base,
  cursor: 'pointer',
}
