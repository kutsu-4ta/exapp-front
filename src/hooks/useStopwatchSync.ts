import {useState} from 'react'
import {useTimer} from '../context/TimerContext'
import {startStopwatch, stopStopwatch} from '../lib/api/stopwatch'

type StopwatchSyncResult = {
  time: number
  isActive: boolean
  syncing: boolean
  syncError: string | null
  handleToggle: () => Promise<void>
  reset: () => void
}

// API との同期 toggle を提供する共通フック。
// StopWatchWidget / ExamStopWatchWidget の両方で使用する。
export function useStopwatchSync(): StopwatchSyncResult {
  const { time, isActive, toggle, reset } = useTimer()
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const handleToggle = async () => {
    if (syncing) return
    setSyncing(true)
    setSyncError(null)
    try {
      if (isActive) {
        await stopStopwatch()
      } else {
        await startStopwatch()
      }
      toggle()
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : '通信エラーが発生しました')
    } finally {
      setSyncing(false)
    }
  }

  return { time, isActive, syncing, syncError, handleToggle, reset }
}
