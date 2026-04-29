import {useCallback, useRef, useState} from "react";

type Props = {
  value: string | null
  readonly: boolean
  onSave: (text: string | null) => Promise<void>
}

export function DayReflection({ value, readonly, onSave }: Props) {
  const [text, setText] = useState(value ?? '')
  const [saved, setSaved] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value
      setText(v)
      setSaved(false)

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        try {
          await onSave(v.trim() || null)
          setSaved(true)
        } catch {
          // silent — will retry on next change
        }
      }, 800)
    },
    [onSave],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label
          style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: '#8a7b6e',
            letterSpacing: '0.04em',
          }}
        >
          振り返り
        </label>
        {!readonly && !saved && (
          <span style={{ fontSize: '0.75rem', color: '#c9c0b8' }}>●</span>
        )}
        {!readonly && saved && text && (
          <span style={{ fontSize: '0.75rem', color: '#4c7a3a' }}>✓</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        readOnly={readonly}
        placeholder={readonly ? '' : '今日気づいたこと、明日への一言…'}
        rows={4}
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          border: '1px solid #edeae6',
          borderRadius: '8px',
          backgroundColor: readonly ? '#f8f7f5' : '#ffffff',
          color: '#1a1108',
          fontSize: '0.9375rem',
          fontFamily: 'inherit',
          letterSpacing: '0.01em',
          lineHeight: 1.7,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
