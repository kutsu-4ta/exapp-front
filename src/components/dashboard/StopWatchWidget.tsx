import {useStopwatchSync} from '../../hooks/useStopwatchSync'
import {calcLogUrl} from '../../hooks/useStopwatchDisplay'
import {StopWatchDisplay} from './StopWatchDisplay'
import {StopWatchControls} from './StopWatchControls'
import {container, widgetCard} from './styles/StopWatchWidget.styles'

// re-export: ExamStopWatchWidget が参照するため維持
export { SyncSpinner } from './icons/SyncSpinner'

export function StopWatchWidget() {
  const { time, isActive, syncing, syncError, handleToggle, reset } = useStopwatchSync()
  const logUrl = calcLogUrl(time)

  return (
    <div style={container}>
      <div style={widgetCard}>
        <StopWatchDisplay time={time} isActive={isActive} logUrl={logUrl} syncError={syncError} />
        <StopWatchControls
          time={time}
          isActive={isActive}
          syncing={syncing}
          onToggle={handleToggle}
          onReset={reset}
        />
      </div>
    </div>
  )
}
