import type {FailureType} from '@/types/workspace.ts'
import {FAILURE_TYPE_VALUES} from '@/types/workspace.ts'

type Props = {
  value: FailureType[]
  onChange: (next: FailureType[]) => void
}

export function FailureTypeSelector({ value, onChange }: Props) {
  function toggle(ft: FailureType) {
    const next = value.includes(ft) ? value.filter((x) => x !== ft) : [...value, ft]
    onChange(next)
  }

  return (
      <div style={{ display: 'flex', gap: '6px' }}>
        {FAILURE_TYPE_VALUES.map((ft) => {
          const selected = value.includes(ft)

          // 選択時のみ各カラーを適用し、未選択時は一貫して控えめなグレーにする
          const styleConfig = {
            定義: {
              color: selected ? '#2563eb' : 'rgba(55, 53, 47, 0.5)',
              bg: selected ? 'rgba(37,99,235, 0.1)' : 'transparent',
              borderColor: selected ? 'rgba(37,99,235, 0.2)' : 'rgba(55, 53, 47, 0.12)',
            },
            解法: {
              color: selected ? '#d73a49' : 'rgba(55, 53, 47, 0.5)',
              bg: selected ? 'rgba(215,58,73, 0.1)' : 'transparent',
              borderColor: selected ? 'rgba(215,58,73, 0.2)' : 'rgba(55, 53, 47, 0.12)',
            },
            ケアレス: {
              color: selected ? '#d29922' : 'rgba(55, 53, 47, 0.5)',
              bg: selected ? 'rgba(210,153,34, 0.1)' : 'transparent',
              borderColor: selected ? 'rgba(210,153,34, 0.2)' : 'rgba(55, 53, 47, 0.12)',
            },
          } as const

          const current = styleConfig[ft]

          return (
              <button
                  key={ft}
                  type="button"
                  onClick={() => toggle(ft)}
                  style={{
                    ...failureTypePill,
                    color: current.color,
                    backgroundColor: current.bg,
                    borderColor: current.borderColor,
                  }}
              >
                {ft}
              </button>
          )
        })}
      </div>
  )
}

const failureTypePill = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 10px',
  borderRadius: '4px',
  border: '1px solid', // 枠線は維持
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: '1.2',
  transition: 'all 20ms ease-in 0s',
} as const