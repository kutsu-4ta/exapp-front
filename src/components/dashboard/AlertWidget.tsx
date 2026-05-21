import type {AlertStatusItem} from '../../types/workspace'
import {daysSince, formatDaysAgo} from '../../types/workspace'
import {useState} from 'react'
import {useNavigate} from 'react-router-dom'

type AlertEntry = AlertStatusItem & { condition: 1 | 2 }

type Props = {
  alertItems: AlertStatusItem[]
}

export function AlertWidget({ alertItems }: Props) {
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(true)

  const alerts: AlertEntry[] = alertItems.flatMap((item): AlertEntry[] => {
    const s = item.settings

    const cond1 =
      s.touchAlertEnabled &&
      (!item.lastDate ? s.includeUntouched : daysSince(item.lastDate) >= s.thresholdDays)

    const cond2 =
      s.minutesAlertEnabled &&
      item.recentMinutes < s.minutesThreshold

    if (cond1) return [{ ...item, condition: 1 as const }]
    if (cond2) return [{ ...item, condition: 2 as const }]
    return []
  })

  if (alerts.length === 0) return null

  return (
    <div className="mb-6 rounded-lg overflow-hidden border border-[var(--nt-red-border)] bg-[var(--nt-red-bg)]">
      {/* Header */}
      <button
        className="flex items-center justify-between w-full px-4 py-3 cursor-pointer text-left bg-transparent"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertIcon />
          <span className="text-[13px] font-semibold text-n-red truncate">
            {alerts.length} subject{alerts.length === 1 ? '' : 's'} need attention
          </span>
        </div>
        <span className="text-[11px] font-semibold text-n-red/50 uppercase tracking-wide ml-3 shrink-0">
          {isCollapsed ? 'Show' : 'Hide'}
        </span>
      </button>

      {/* Body */}
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-[var(--nt-red-border)]">
          <div className="flex flex-wrap gap-2 pt-3">
            {alerts.map((item) => (
              <AlertCard
                key={item.subject}
                item={item}
                onClick={() => navigate(`/subjects/${encodeURIComponent(item.subject)}`)}
              />
            ))}
          </div>
          <p className="text-[11px] text-n-red/60 mt-3 italic">
            Prioritize neglected subjects to prevent knowledge decay.
          </p>
        </div>
      )}
    </div>
  )
}

function AlertCard({ item, onClick }: { item: AlertEntry; onClick: () => void }) {
  const subLabel =
    item.condition === 1
      ? item.lastDate
        ? formatDaysAgo(item.lastDate)
        : 'Not studied'
      : `Last ${item.settings.minutesThresholdDays}d: ${item.recentMinutes}m`

  return (
    <button
      onClick={onClick}
      className="flex flex-col px-3 py-2 bg-white border border-[var(--nt-red-border)] rounded-md min-w-[88px] text-left cursor-pointer hover:bg-[var(--nt-red-bg)] transition-colors"
    >
      <span className="text-[12px] font-semibold text-n-text leading-none">{item.subject}</span>
      <span className="text-[10px] text-[var(--nt-text-sub)] mt-1">{subLabel}</span>
    </button>
  )
}

function AlertIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#eb5757"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
