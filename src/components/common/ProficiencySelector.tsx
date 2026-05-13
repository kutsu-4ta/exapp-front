import type {Proficiency} from '@/types/workspace.ts'
import {PROFICIENCY_VALUES} from '@/types/workspace.ts'

type Props = {
  value: Proficiency
  onChange: (value: Proficiency) => void
}

const COLOR_MAP = {
  '○': {
    color: '#2ea043',
    activeBg: 'rgba(46,160,67,.12)',
    inactiveBg: 'rgba(46,160,67,.05)',
  },
  '△': {
    color: '#d29922',
    activeBg: 'rgba(210,153,34,.12)',
    inactiveBg: 'rgba(210,153,34,.05)',
  },
  '×': {
    color: '#d73a49',
    activeBg: 'rgba(215,58,73,.12)',
    inactiveBg: 'rgba(215,58,73,.05)',
  },
} as const

export function ProficiencySelector({ value, onChange }: Props) {
  return (
    <div style={wrap}>
      {PROFICIENCY_VALUES.map((p) => {
        const selected = value === p
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            style={{
              ...pill,
              color: COLOR_MAP[p].color,
              backgroundColor: selected ? COLOR_MAP[p].activeBg : COLOR_MAP[p].inactiveBg,
              opacity: selected ? 1 : 0.65,
            }}
          >
            {p}
          </button>
        )
      })}
    </div>
  )
}

const wrap = {
  display: 'flex',
  gap: 8,
} as const

const pill = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '34px',
  padding: '4px 10px',
  borderRadius: '4px',
  border: '1px solid rgba(55,53,47,.12)',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: 1.2,
  transition: 'background 120ms ease',
} as const
