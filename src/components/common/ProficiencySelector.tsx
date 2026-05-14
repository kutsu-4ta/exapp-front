import type {Proficiency} from '@/types/workspace'
import {PROFICIENCY_VALUES} from '@/types/workspace'

type Props =
    | {
  mode?: 'single'
  value: Proficiency
  onChange: (value: Proficiency) => void
}
    | {
  mode: 'multi'
  value: Proficiency[]
  onChange: (value: Proficiency[]) => void
}

const COLOR_MAP = {
  '○': {
    color: '#37352f',
    activeBg: 'rgba(55,53,47,0.08)',
    inactiveBg: 'transparent',
    border: 'rgba(55,53,47,0.16)',
  },
  '△': {
    color: '#d29922',
    activeBg: 'rgba(210,153,34,0.12)',
    inactiveBg: 'rgba(210,153,34,0.04)',
    border: 'rgba(210,153,34,0.2)',
  },
  '×': {
    color: '#eb5757',
    activeBg: 'rgba(235,87,87,0.1)',
    inactiveBg: 'rgba(235,87,87,0.04)',
    border: 'rgba(235,87,87,0.2)',
  },
} as const

export function ProficiencySelector(props: Props) {
  const multi = props.mode === 'multi'

  const isSelected = (p: Proficiency) => {
    if (multi) {
      return props.value.includes(p)
    }
    return props.value === p
  }

  const handleClick = (p: Proficiency) => {
    if (multi) {
      const current = props.value
      const next = current.includes(p)
          ? current.filter((x) => x !== p)
          : [...current, p]

      props.onChange(next)
      return
    }

    props.onChange(p)
  }

  return (
      <div style={wrap}>
        {PROFICIENCY_VALUES.map((p) => {
          const selected = isSelected(p)

          return (
              <button
                  key={p}
                  type="button"
                  onClick={() => handleClick(p)}
                  style={{
                    ...pill,
                    color: COLOR_MAP[p].color,
                    borderColor: COLOR_MAP[p].border,
                    backgroundColor: selected
                        ? COLOR_MAP[p].activeBg
                        : COLOR_MAP[p].inactiveBg,
                    opacity: selected ? 1 : 0.7,
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
  transition: 'all 120ms ease',
} as const