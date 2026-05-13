import {PlayIcon} from './icons/PlayIcon'
import {PauseIcon} from './icons/PauseIcon'
import {SyncSpinner} from './icons/SyncSpinner'
import * as S from './styles/StopWatchWidget.styles'

interface StopWatchControlsProps {
  time: number
  isActive: boolean
  syncing: boolean
  onToggle: () => void
  onReset: () => void
}

export function StopWatchControls({
  time,
  isActive,
  syncing,
  onToggle,
  onReset,
}: StopWatchControlsProps) {
  return (
    <div style={S.controls}>
      {time > 0 && !isActive && (
        <button onClick={onReset} style={S.iconBtn} title="リセット" disabled={syncing}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      )}
      <button
        onClick={onToggle}
        style={S.toggleBtn(isActive, syncing)}
        disabled={syncing}
        aria-label={isActive ? '停止' : '開始'}
      >
        {syncing ? <SyncSpinner /> : isActive ? <PauseIcon /> : <PlayIcon />}
      </button>
    </div>
  )
}
