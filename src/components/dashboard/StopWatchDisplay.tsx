import { StopWatchTime } from './StopWatchTime'
import * as S from './styles/StopWatchWidget.styles'

interface StopWatchDisplayProps {
    time: number
    isActive: boolean
    logUrl: string
    syncError: string | null
}

export function StopWatchDisplay({ time, isActive, logUrl, syncError }: StopWatchDisplayProps) {
    return (
        <div style={S.displaySection}>
            <span style={S.label}>STUDY TIMER</span>
            <StopWatchTime time={time} isActive={isActive} logUrl={logUrl} />
            {syncError && <span style={S.errorHint}>{syncError}</span>}
        </div>
    )
}
