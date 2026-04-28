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
  fontWeight: 600,
  marginBottom: '6px',
  letterSpacing: '0.02em',
}

export const cardSubStyle: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textHint,
  marginTop: '6px',
}
