import {c} from '../../styles/notion'

type Props = { active: boolean; onClick: () => void; children: React.ReactNode }

export function FilterPill({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...base,
        backgroundColor: active ? 'rgba(55, 53, 47, 0.08)' : 'transparent',
        color: active ? c.text : c.textSub,
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  )
}

const base: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: '13px',
  borderRadius: '4px',
  border: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'background 0.2s',
}
