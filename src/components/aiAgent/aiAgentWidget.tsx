import {useState} from 'react'
import type {AdviceMode} from '@/types/aiAgent.ts'
import {ADVICE_MODES} from '@/types/aiAgent.ts'

type Props = {
  onGetAdvice: (mode: AdviceMode) => Promise<string>
}

export function AIAgentWidget({ onGetAdvice }: Props) {
  const [selectedMode, setSelectedMode] = useState<AdviceMode>('ANALYSIS')
  const [advice, setAdvice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  const currentMode = ADVICE_MODES.find((m) => m.value === selectedMode)!

  const handleRequest = async () => {
    setLoading(true)
    setAdvice(null)
    setError(null)
    setVisible(false)
    try {
      const result = await onGetAdvice(selectedMode)
      setAdvice(result)
      // 2フレーム後にフェードイン開始（DOMに描画されてからtransitionを効かせる）
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => {
      setAdvice(null)
      setError(null)
    }, 220)
  }

  return (
    <div style={aiWidgetWrapper}>
      <div style={container}>
        {/* コントロール行 */}
        <div style={controls}>
          <div style={selectWrapper}>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as AdviceMode)}
              style={notionSelect}
              disabled={loading}
            >
              {ADVICE_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.icon} {m.label}
                </option>
              ))}
            </select>
            <div style={selectArrow}>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <button
            onClick={handleRequest}
            disabled={loading}
            style={{ ...notionAdviceBtn, opacity: loading ? 0.55 : 1 }}
          >
            {loading ? (
              <span style={spinnerDot}>●●●</span>
            ) : (
              <>
                <span style={{ fontSize: '13px' }}>✨</span>
                <span>聞く</span>
              </>
            )}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={errorBox}>
            <span style={errorText}>{error}</span>
            <button onClick={handleClose} style={errorCloseBtn}>
              ×
            </button>
          </div>
        )}

        {/* アドバイス表示エリア */}
        {advice && (
          <div
            style={{
              ...adviceBox,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.22s ease, transform 0.22s ease',
            }}
          >
            <div style={adviceHeader}>
              <span style={adviceModeTag}>
                {currentMode.icon} {currentMode.label}
              </span>
              <button onClick={handleClose} style={closeBtn} aria-label="閉じる">
                ×
              </button>
            </div>
            <p style={adviceText}>{advice}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const container: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const controls: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  gap: '6px',
  height: '34px',
  alignItems: 'stretch',
}

const selectWrapper: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  minWidth: '110px',
}

const notionSelect: React.CSSProperties = {
  width: '100%',
  height: '100%',
  fontSize: '13px',
  fontWeight: 500,
  padding: '0 24px 0 8px',
  borderRadius: '6px',
  border: '1px solid rgba(55, 53, 47, 0.12)',
  background: 'rgba(55, 53, 47, 0.04)',
  color: '#37352f',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
}

const selectArrow: React.CSSProperties = {
  position: 'absolute',
  right: '8px',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  color: 'rgba(55, 53, 47, 0.35)',
}

const notionAdviceBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  fontSize: '13px',
  fontWeight: 700,
  padding: '0 12px',
  borderRadius: '6px',
  border: '1px solid rgba(55, 53, 47, 0.12)',
  background: '#ffffff',
  color: '#37352f',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  transition: 'opacity 0.15s',
}

const spinnerDot: React.CSSProperties = {
  fontSize: '8px',
  letterSpacing: '2px',
  color: 'rgba(55,53,47,0.4)',
  animation: 'none',
}

const adviceBox: React.CSSProperties = {
  borderRadius: '6px',
  border: '1px solid rgba(55, 53, 47, 0.08)',
  background: 'rgba(55, 53, 47, 0.02)',
  padding: '10px 12px',
}

const adviceHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '6px',
}

const adviceModeTag: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.4)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const adviceText: React.CSSProperties = {
  fontSize: '13px',
  color: '#37352f',
  lineHeight: 1.65,
  margin: 0,
  whiteSpace: 'pre-wrap',
}

const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  color: 'rgba(55,53,47,0.3)',
  padding: '0 2px',
  lineHeight: 1,
}

const errorBox: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '6px',
  border: '1px solid rgba(235, 87, 87, 0.2)',
  background: 'rgba(235, 87, 87, 0.04)',
  padding: '8px 10px',
}

const errorText: React.CSSProperties = {
  fontSize: '12px',
  color: '#eb5757',
}

const errorCloseBtn: React.CSSProperties = {
  ...closeBtn,
  color: 'rgba(235,87,87,0.5)',
}
const aiWidgetWrapper: React.CSSProperties = {
  flex: '1 1 280px', // 最小幅を確保しつつ、空きスペースを埋める
  background: '#fff',
  padding: '8px 12px', // 上下のパディングを少し削り、横とのバランスを調整
  borderRadius: '8px',
  border: '1px solid rgba(55, 53, 47, 0.08)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center', // 中身を垂直中央に
}
