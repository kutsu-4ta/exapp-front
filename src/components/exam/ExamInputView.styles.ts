import {c, font} from '@/styles/notion.ts'

export const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 16px',
  color: c.text,
}

export const stickyHeader: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 900,
  backgroundColor: 'rgba(255,255,255,0.98)',
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${c.border}`,
  margin: '0 -16px 20px',
  padding: '12px 20px',
}

export const headerTopRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
}

export const examContextLine: React.CSSProperties = {
  flex: 1,
  fontSize: '13px',
  fontWeight: 800,
  color: c.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  marginRight: '8px',
}

export const statsBadge: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  backgroundColor: c.surface,
  padding: '4px 12px',
  borderRadius: '20px',
}

export const statItem: React.CSSProperties = { fontSize: font.sm, fontWeight: 800 }

export const dotO: React.CSSProperties = { color: c.blue }
export const dotX: React.CSSProperties = { color: c.red }

export const scoreGrid: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  paddingBottom: '8px',
}

export const scoreCell: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
}

export const scoreLab: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  color: c.textHint,
}

export const scoreVal: React.CSSProperties = { fontSize: '32px', fontWeight: 900 }

export const scoreValPure: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 900,
  color: '#19a576',
}

export const scoreVLine: React.CSSProperties = {
  width: '1px',
  height: '30px',
  backgroundColor: c.border,
}

export const contentBody: React.CSSProperties = { paddingTop: '10px' }

export const autoCompleteInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  fontSize: '13px',
  fontWeight: 600,
  boxSizing: 'border-box',
}

export const yearInput: React.CSSProperties = {
  width: '60px',
  padding: '8px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  fontSize: '13px',
  textAlign: 'center',
}

export const gridContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

export const footer: React.CSSProperties = {
  marginTop: '40px',
  paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
}

export const footerActionGroup: React.CSSProperties = { display: 'flex', gap: '10px' }

export const finishBtn: React.CSSProperties = {
  flex: 2,
  padding: '16px',
  backgroundColor: c.blue,
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  fontSize: font.base,
  fontWeight: 800,
  cursor: 'pointer',
}

export const saveBtn: React.CSSProperties = {
  flex: 2,
  padding: '16px',
  backgroundColor: c.text,
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  fontSize: font.base,
  fontWeight: 800,
  cursor: 'pointer',
}

export const examBackBtn: React.CSSProperties = {
  flex: 1,
  padding: '16px',
  backgroundColor: '#fff',
  color: c.text,
  border: `1px solid ${c.border}`,
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
}

export const solvedBtn: React.CSSProperties = {
  flex: 1,
  padding: '16px',
  backgroundColor: '#fff8ec',
  color: '#d48b00',
  border: '1px solid #f2c55a',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
}

export const solvedMarker: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 12px',
  backgroundColor: '#fff8ec',
  color: '#d48b00',
  border: '1px solid #f2c55a',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

export const solvedBadge: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#d48b00',
  backgroundColor: '#fff8ec',
  border: '1px solid #f2c55a',
  padding: '3px 8px',
  borderRadius: '10px',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}
