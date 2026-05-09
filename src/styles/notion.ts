// Notion-style design tokens shared across dashboard/weak components

export const c = {
  text:       '#37352f',
  textSub:    'rgba(55, 53, 47, 0.45)',
  textHint:   'rgba(55, 53, 47, 0.35)',
  textFaint:  'rgba(55, 53, 47, 0.3)',
  border:     'rgba(55, 53, 47, 0.09)',
  borderXs:   'rgba(55, 53, 47, 0.04)',
  surface:    'rgba(55, 53, 47, 0.02)',
  blue:       '#2383e2',
  blueBg:     'rgba(35, 131, 226, 0.04)',
  blueBorder: 'rgba(35, 131, 226, 0.15)',
  red:        '#eb5757',
  redBg:      'rgba(235, 87, 87, 0.05)',
  redBorder:  'rgba(235, 87, 87, 0.15)',
  bg:         '#fff',
} as const

export const font = {
  xs:   '10px',
  sm:   '11px',
  base: '14px',
  md:   '16px',
} as const

// Common reusable style fragments
export const sectionLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: font.sm,
  fontWeight: 700,
  color: c.textHint,
  letterSpacing: '0.05em',
  marginBottom: '12px',
}

export const triangleStyle: React.CSSProperties = { fontSize: '8px' }

export const cardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  position: 'relative',
  transition: 'background 0.2s ease',
}

export const cardLabelStyle: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  fontWeight: 400,
  marginBottom: '6px',
  letterSpacing: '0.02em',
}

export const cardSubStyle: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textHint,
  marginTop: '6px',
}

export const backBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)', fontWeight: 600,
  padding: '4px 8px', marginLeft: '-8px', marginBottom: '24px',
  display: 'flex', alignItems: 'center', borderRadius: '4px',
}

// ── Layout ────────────────────────────────────────────────────────────────────
export const pageWrap: React.CSSProperties = {
  backgroundColor: c.bg, minHeight: '100vh', color: c.text,
}
export const pageContent: React.CSSProperties = {
  width: '100%', maxWidth: '720px', margin: '0 auto', padding: '40px 20px 100px',
}
export const pageContentSm: React.CSSProperties = {
  width: '100%', maxWidth: '560px', margin: '0 auto', padding: '48px 20px 120px',
}
export const pageHeading: React.CSSProperties = {
  fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 32px',
}

// ── Section headers ───────────────────────────────────────────────────────────
export const sectionWrap: React.CSSProperties = { marginBottom: '8px', paddingLeft: '2px' }
export const sectionHead: React.CSSProperties = {
  fontSize: font.sm, fontWeight: 700, color: c.textHint,
  letterSpacing: '0.06em', textTransform: 'uppercase',
}

// ── Buttons ───────────────────────────────────────────────────────────────────
export const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', backgroundColor: c.blue, color: '#fff',
  border: 'none', borderRadius: '6px', fontSize: font.base, fontWeight: 600, cursor: 'pointer',
}
export const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', backgroundColor: 'transparent',
  border: `1px solid rgba(55,53,47,0.16)`, borderRadius: '6px',
  fontSize: font.base, fontWeight: 600, color: c.textSub, cursor: 'pointer',
}
export const btnDanger: React.CSSProperties = {
  padding: '6px 12px', backgroundColor: c.red, color: '#fff',
  border: 'none', borderRadius: '6px', fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
}
export const btnGhost: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: font.sm, color: c.textSub, fontWeight: 600, padding: '4px 8px',
}

// ── Forms ─────────────────────────────────────────────────────────────────────
export const formInput: React.CSSProperties = {
  border: `1px solid rgba(55,53,47,0.12)`, borderRadius: '6px',
  padding: '8px 10px', fontSize: font.base, color: c.text, outline: 'none',
  backgroundColor: 'rgba(55,53,47,0.02)', width: '100%', boxSizing: 'border-box',
}
export const formTextarea: React.CSSProperties = {
  border: `1px solid rgba(55,53,47,0.12)`, borderRadius: '6px',
  padding: '8px 10px', fontSize: font.base, color: c.text, outline: 'none',
  backgroundColor: 'rgba(55,53,47,0.02)', width: '100%', boxSizing: 'border-box',
  resize: 'vertical', fontFamily: 'inherit', minHeight: '80px',
}
export const formLabel: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: c.textSub,
}

// ── Utilities ─────────────────────────────────────────────────────────────────
export const dividerLine: React.CSSProperties = {
  height: '1px', backgroundColor: 'rgba(55,53,47,0.06)', margin: '4px 0',
}
export const emptyMsg: React.CSSProperties = {
  fontSize: font.base, color: c.textHint, padding: '24px 0', textAlign: 'center',
}
export const errorMsg: React.CSSProperties = {
  fontSize: '12px', color: c.red, fontWeight: 500,
}
export const blockCard: React.CSSProperties = {
  border: `1px solid ${c.border}`, borderRadius: '10px',
  padding: '20px', marginBottom: '32px', backgroundColor: c.bg,
}
export const blockDanger: React.CSSProperties = {
  border: `1px solid ${c.redBorder}`, borderRadius: '10px',
  padding: '20px', marginBottom: '32px', backgroundColor: c.redBg,
}
