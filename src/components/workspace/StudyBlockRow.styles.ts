import { c } from '@/styles/notion.ts'

export const editableRow: React.CSSProperties = {
    background: '#ffffff', border: `1px solid ${c.border}`,
    borderRadius: '4px', padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    transition: 'border-color 0.2s ease', position: 'relative',
}

export const flexRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px',
}

export const flexRowSecondary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '20px', paddingLeft: '4px',
}

export const inputGroup: React.CSSProperties = {
    display: 'flex', alignItems: 'baseline', gap: '4px', minWidth: '70px',
}

export const notionNumInp: React.CSSProperties = {
    width: '38px', fontSize: '16px', fontWeight: 600, color: c.text,
    border: 'none', background: 'transparent', outline: 'none', textAlign: 'right',
}

export const unitText: React.CSSProperties = {
    fontSize: '12px', color: c.textSub, fontWeight: 400,
}

export const notionMainInp: React.CSSProperties = {
    flex: 1, fontSize: '16px', fontWeight: 600, color: c.text,
    border: 'none', background: 'transparent', outline: 'none',
}

export const notionSubInp: React.CSSProperties = {
    width: '100%', fontSize: '16px', color: 'rgba(55, 53, 47, 0.65)',
    border: 'none', background: 'transparent', outline: 'none',
}

export const notionMemoInp: React.CSSProperties = {
    flex: 1, fontSize: '16px', color: c.textSub,
    border: 'none', background: 'transparent', outline: 'none',
}

export const tinyLabel: React.CSSProperties = {
    fontSize: '9px', fontWeight: 700, color: c.textFaint, letterSpacing: '0.05em',
}

export const notionSaveBtn: React.CSSProperties = {
    fontSize: '12px', fontWeight: 500, padding: '4px 10px',
    borderRadius: '3px', border: `1px solid rgba(55, 53, 47, 0.16)`,
    cursor: 'pointer', background: '#fff', transition: 'background 0.2s',
}

export const notionDeleteBtn: React.CSSProperties = {
    fontSize: '12px', color: c.textSub, background: 'none',
    border: 'none', cursor: 'pointer', padding: '4px 8px',
}

export const notionDeleteConfirmBtn: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: '#fff',
    background: c.red, border: 'none', borderRadius: '3px',
    cursor: 'pointer', padding: '4px 8px',
}

export const notionDeleteCancelBtn: React.CSSProperties = {
    fontSize: '12px', color: c.textSub, background: 'none',
    border: `1px solid rgba(55, 53, 47, 0.16)`, borderRadius: '3px',
    cursor: 'pointer', padding: '3px 7px',
}

export const readonlyRow: React.CSSProperties = {
    padding: '12px 14px', background: c.surface,
    borderRadius: '4px', border: '1px solid transparent',
}

export const timeBadge: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: c.textSub, marginBottom: '4px',
}

export const contentLayout: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
}

export const subjectText: React.CSSProperties = {
    fontSize: '14px', fontWeight: 600, color: c.text,
}

export const tagStyle: React.CSSProperties = {
    fontSize: '12px', padding: '1px 6px',
    background: 'rgba(55, 53, 47, 0.08)', borderRadius: '3px', color: c.text,
}

export const materialText: React.CSSProperties = {
    fontSize: '12px', color: c.textSub,
}

export const memoText: React.CSSProperties = {
    fontSize: '13px', color: 'rgba(55, 53, 47, 0.65)', marginTop: '6px', lineHeight: '1.5',
}

export const errorStyle: React.CSSProperties = {
    fontSize: '12px', color: c.red, marginTop: '4px',
}
