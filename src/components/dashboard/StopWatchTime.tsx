import {Link} from 'react-router-dom'
import {formatTime} from '../../hooks/useStopwatchDisplay'
import * as S from './styles/StopWatchWidget.styles'

interface StopWatchTimeProps {
  time: number
  isActive: boolean
  logUrl: string
}

export function StopWatchTime({ time, isActive, logUrl }: StopWatchTimeProps) {
  const { main, sub } = formatTime(time)

  if (isActive) {
    return (
      <div style={S.timeWrapper}>
        <span style={S.mainTime}>{main}</span>
        <span style={S.subTime}>{sub}</span>
      </div>
    )
  }

  if (time > 0) {
    return (
      <Link to={logUrl} style={S.timeLink}>
        <div style={S.timeWrapper}>
          <span style={S.mainTime}>{main}</span>
          <span style={S.subTime}>{sub}</span>
        </div>
        <span style={S.saveHint}>記録する →</span>
      </Link>
    )
  }

  return (
    <div style={S.timeWrapper}>
      <span style={S.mainTime}>0:00</span>
      <span style={S.subTime}>.00</span>
    </div>
  )
}
