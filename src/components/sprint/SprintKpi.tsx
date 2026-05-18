import {useState} from 'react'
import type {SprintStats} from '../../types/sprint'
import {c, font} from '../../styles/notion'

type Props = {
  stats: SprintStats | undefined
  loading?: boolean
}

function StatChip({
  label,
  value,
  color,
  bold,
}: {
  label: string
  value: number
  color: string
  bold?: boolean
}) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: 'center',
        padding: '8px 4px',
        borderRadius: '8px',
        backgroundColor: bold ? color + '12' : 'rgba(55,53,47,0.02)',
        border: `1px solid ${bold ? color + '30' : c.border}`,
      }}
    >
      <div
        style={{
          fontSize: bold ? '22px' : '18px',
          fontWeight: 700,
          color: bold ? color : c.text,
          lineHeight: 1,
          marginBottom: '3px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: font.xs, color: c.textHint, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

export function SprintKpi({ stats, loading }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (loading || !stats) {
    return (
      <div style={{ padding: '12px 16px' }}>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(55,53,47,0.06)',
            marginBottom: 12,
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 60,
                borderRadius: 8,
                backgroundColor: 'rgba(55,53,47,0.04)',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  const rate = Math.round(stats.completionRate)

  return (
    <div style={{ padding: '12px 16px 0' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px',
          }}
        >
          <span style={{ fontSize: font.sm, fontWeight: 600, color: c.textSub }}>消化率</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#27ae60' }}>{rate}%</span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(55,53,47,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${rate}%`,
              borderRadius: 3,
              backgroundColor: '#27ae60',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        {stats.avgCompleteDays !== null && (
          <div style={{ marginTop: '4px', fontSize: font.xs, color: c.textHint }}>
            平均完了 {stats.avgCompleteDays.toFixed(1)} 日
          </div>
        )}
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <StatChip label="DONE" value={stats.done} color="#27ae60" bold />
        <StatChip label="DOING" value={stats.doing} color="#2383e2" />
        <StatChip label="TODO" value={stats.todo} color={c.textHint} />
        <StatChip label="TOTAL" value={stats.total} color={c.textHint} />
      </div>

      {/* SubCategory breakdown */}
      {stats.bySubCategory.length > 0 && (
        <div style={{ marginBottom: '4px' }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: font.xs,
              color: c.textHint,
              fontWeight: 600,
              padding: '0 0 6px',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{expanded ? '▾' : '▸'}</span>
            <span>小分類別</span>
          </button>
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              {stats.bySubCategory.map((sc) => {
                const pct = sc.total > 0 ? Math.round((sc.done / sc.total) * 100) : 0
                return (
                  <div key={sc.subCategoryId}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '2px',
                      }}
                    >
                      <span style={{ fontSize: font.xs, color: c.textSub }}>{sc.subCategoryName}</span>
                      <span style={{ fontSize: font.xs, color: c.textHint }}>
                        {sc.done}/{sc.total}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: 'rgba(55,53,47,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: 2,
                          backgroundColor: '#27ae60',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
