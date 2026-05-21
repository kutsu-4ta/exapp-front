import {useState} from 'react'
import type {Sprint, SprintStats} from '../../types/sprint'
import {c, font} from '../../styles/notion'

type Props = {
  stats: SprintStats | undefined
  loading?: boolean
  compact?: boolean
  sprint?: Sprint | null
  isCompleted?: boolean
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

export function SprintKpi({ stats, loading, compact, sprint, isCompleted }: Props) {
  const [expanded, setExpanded] = useState(false)

  // ── Compact strip (mobile) — Notion property panel style ───────────────────
  if (compact) {
    const rate = stats ? Math.round(stats.completionRate) : 0
    const isBacklog = sprint?.type === 'backlog'
    const showDate = !isBacklog && !!sprint?.startDate

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = sprint?.endDate && !isCompleted ? new Date(sprint.endDate + 'T00:00:00') : null
    const remainingDays = endDate
      ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null
    const remainingColor =
      remainingDays === null ? c.textHint
      : remainingDays <= 0  ? '#eb5757'
      : remainingDays <= 3  ? '#f2ab26'
      : c.textHint
    const remainingLabel =
      remainingDays === null ? null
      : remainingDays < 0   ? '期限切れ'
      : remainingDays === 0 ? '今日まで'
      : `残り ${remainingDays} 日`

    const progressColor =
      isCompleted   ? '#27ae60'
      : rate >= 70  ? '#27ae60'
      : rate >= 30  ? '#2383e2'
      : 'rgba(55,53,47,0.28)'

    return (
      <div style={{ padding: '14px 16px 16px', borderBottom: `1px solid ${c.border}` }}>

        {/* Sprint goal — page-title weight */}
        <p style={{
          margin: '0 0 12px',
          fontSize: '18px',
          fontWeight: 700,
          color: sprint?.goal ? c.text : c.textHint,
          letterSpacing: '-0.01em',
          lineHeight: 1.45,
          maxHeight: '2.9em',
          overflow: 'hidden',
        }}>
          {sprint?.goal ?? (isBacklog ? 'Backlog' : '—')}
        </p>

        {/* Property rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

          {/* 期間 */}
          {showDate && (
            <div style={{ display: 'flex', alignItems: 'center', minHeight: '22px' }}>
              <span style={propLabel}>期間</span>
              <span style={{ ...propValue, flex: 1 }}>
                {sprint!.startDate} – {sprint!.endDate ?? '?'}
              </span>
              {remainingLabel && !isCompleted && (
                <span style={{
                  fontSize: font.sm,
                  color: remainingColor,
                  fontWeight: remainingDays !== null && remainingDays <= 3 ? 600 : 400,
                  flexShrink: 0,
                  marginLeft: 8,
                }}>
                  {remainingLabel}
                </span>
              )}
              {isCompleted && (
                <span style={{ fontSize: font.sm, color: '#27ae60', fontWeight: 600, marginLeft: 8, flexShrink: 0 }}>
                  完了済み
                </span>
              )}
            </div>
          )}

          {/* 進捗 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: '22px' }}>
            <span style={propLabel}>進捗</span>
            {loading ? (
              <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(55,53,47,0.05)' }} />
            ) : (
              <>
                <div style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(55,53,47,0.06)',
                  overflow: 'hidden',
                }}>
                  {stats && (
                    <div style={{
                      height: '100%',
                      width: `${rate}%`,
                      borderRadius: 2,
                      backgroundColor: progressColor,
                      transition: 'width 0.5s ease',
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: font.base,
                  fontWeight: 700,
                  color: stats ? '#27ae60' : c.textHint,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '34px',
                  textAlign: 'right',
                }}>
                  {rate}%
                </span>
                {stats && (
                  <span style={{
                    fontSize: font.sm,
                    color: c.textHint,
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {stats.done}/{stats.total}
                  </span>
                )}
              </>
            )}
          </div>

          {/* 完了済み（日付なしのケース） */}
          {isCompleted && !showDate && (
            <div style={{ display: 'flex', alignItems: 'center', minHeight: '22px' }}>
              <span style={propLabel}>状態</span>
              <span style={{ fontSize: font.base, color: '#27ae60', fontWeight: 600 }}>完了済み</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Full mode (iPad/desktop) ────────────────────────────────────────────────
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

// ── Shared styles ─────────────────────────────────────────────────────────────

const propLabel: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textHint,
  fontWeight: 500,
  width: '40px',
  flexShrink: 0,
}

const propValue: React.CSSProperties = {
  fontSize: font.base,
  color: c.textSub,
  fontVariantNumeric: 'tabular-nums',
}
