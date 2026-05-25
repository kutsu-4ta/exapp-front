import type {CSSProperties, ReactNode} from 'react'
import {c} from '../../styles/notion'

// ── BottomSheet ──────────────────────────────────────────────────────────────
// Renders: dimmed overlay + rounded-top sheet + drag handle.
// Two layout modes:
//   - Scroll  (default): sheet has maxHeight + overflowY:auto
//   - Flex    (height prop): sheet has fixed height + display:flex+column; children manage their own scroll

type BottomSheetProps = {
  onClose?: () => void
  children: ReactNode
  zIndex?: number
  maxWidth?: number | string
  maxHeight?: string
  height?: string
  showHandle?: boolean
  paddingBottom?: string
}

export function BottomSheet({
  onClose,
  children,
  zIndex = 1200,
  maxWidth = 720,
  maxHeight = '90vh',
  height,
  showHandle = true,
  paddingBottom,
}: BottomSheetProps) {
  const maxWidthStr = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

  const sheetStyle: CSSProperties = height
    ? {
        width: '100%',
        maxWidth: maxWidthStr,
        margin: '0 auto',
        backgroundColor: '#fff',
        borderRadius: '16px 16px 0 0',
        height,
        display: 'flex',
        flexDirection: 'column',
      }
    : {
        width: '100%',
        maxWidth: maxWidthStr,
        margin: '0 auto',
        backgroundColor: '#fff',
        borderRadius: '16px 16px 0 0',
        maxHeight,
        overflowY: 'auto',
        ...(paddingBottom ? { paddingBottom } : {}),
      }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        {showHandle && (
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'rgba(55,53,47,0.15)',
            margin: '10px auto 0',
            flexShrink: 0,
          }} />
        )}
        {children}
      </div>
    </div>
  )
}

// ── SheetField ───────────────────────────────────────────────────────────────
// Renders a vertical field group: uppercase label + content.
// Replaces the repeated `fieldGroup + fieldLabel` / `section + sectionLbl` pattern.

type SheetFieldProps = {
  label: ReactNode
  children: ReactNode
  gap?: number
}

export function SheetField({ label, children, gap = 8 }: SheetFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      <p style={fieldLabelStyle}>{label}</p>
      {children}
    </div>
  )
}

// ── Shared style constants ───────────────────────────────────────────────────

export const fieldLabelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.35)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  margin: 0,
}

// Header: title left + close button absolute top-right (most common pattern)
export const sheetHeaderStyle: CSSProperties = {
  position: 'relative',
  padding: '16px 48px 14px 20px',
  borderBottom: `1px solid ${c.border}`,
  flexShrink: 0,
}

// Header: flex space-between (for × left / badge right layouts)
export const sheetFlexHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: `1px solid ${c.border}`,
  flexShrink: 0,
}

// Close button: absolutely positioned inside sheetHeaderStyle
export const sheetCloseBtnAbsStyle: CSSProperties = {
  position: 'absolute',
  top: '14px',
  right: '16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(55,53,47,0.3)',
  padding: '4px',
  borderRadius: '4px',
  fontSize: '18px',
  lineHeight: 1,
}

// Close button: inline (for flex header)
export const sheetCloseBtnStyle: CSSProperties = {
  border: 'none',
  background: 'none',
  fontSize: '20px',
  color: 'rgba(55,53,47,0.4)',
  cursor: 'pointer',
  lineHeight: 1,
  padding: '0 2px',
}

// Body for scrollable content inside flex-column sheet
export const sheetBodyStyle: CSSProperties = {
  padding: '20px 16px',
  overflowY: 'auto',
  flex: 1,
}

// Full-width close button at the bottom of sheet content
export const sheetBottomCloseBtnStyle: CSSProperties = {
  width: '100%',
  padding: '14px',
  border: '1px solid rgba(55,53,47,0.14)',
  borderRadius: '10px',
  backgroundColor: '#fff',
  fontSize: '15px',
  fontWeight: 600,
  color: 'rgba(55,53,47,0.6)',
  cursor: 'pointer',
}
