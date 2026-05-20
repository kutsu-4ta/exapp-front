import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Network} from 'lucide-react'
import type {Problem} from '../../types/workspace'
import {fetchRelated} from '../../lib/problems/related'
import {c, font} from '../../styles/notion'

type Props = {
  current: Problem
  onSelect: (problem: Problem) => void
}

export function RelatedProblemsSection({current, onSelect}: Props) {
  const navigate = useNavigate()
  const [related, setRelated] = useState<Problem[]>([])

  useEffect(() => {
    fetchRelated(current)
      .then(setRelated)
      .catch(() => {})
  }, [current.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (related.length === 0) return null

  return (
    <div style={container}>
      <div style={header}>
        <span style={headerLabel}>芋づる</span>
        <span style={headerCount}>{related.length}件</span>
        <div style={{flex: 1}} />
        <button
          style={graphBtn}
          title="グラフで見る"
          onClick={() =>
            navigate(`/problems/${current.id}/graph`, {state: {problem: current}})
          }
        >
          <Network size={13} />
          <span style={graphBtnLabel}>グラフ</span>
        </button>
      </div>
      <div style={list}>
        {related.map((p) => (
          <button key={p.id} style={row} onClick={() => onSelect(p)}>
            <div style={rowContent}>
              <div style={rowTitle}>{p.subCategory ?? p.subject}</div>
              <div style={rowMeta}>
                {[p.subCategory ? p.subject : null, p.questionRef]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
            <span style={arrow}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const container: React.CSSProperties = {
  marginBottom: 14,
}

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 12px 8px',
  borderBottom: `1px solid ${c.border}`,
}

const headerLabel: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 700,
  color: c.textHint,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const headerCount: React.CSSProperties = {
  fontSize: font.xs,
  fontWeight: 600,
  color: c.textFaint,
}

const graphBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  background: 'none',
  border: `1px solid ${c.border}`,
  borderRadius: 6,
  padding: '3px 8px',
  cursor: 'pointer',
  color: c.textSub,
}

const graphBtnLabel: React.CSSProperties = {
  fontSize: font.xs,
  fontWeight: 600,
}

const list: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '9px 12px',
  background: 'none',
  border: 'none',
  borderBottom: `1px solid ${c.border}`,
  cursor: 'pointer',
  textAlign: 'left',
}

const rowContent: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const rowTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: c.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const rowMeta: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  marginTop: 1,
}

const arrow: React.CSSProperties = {
  flexShrink: 0,
  fontSize: '14px',
  color: c.textFaint,
}
