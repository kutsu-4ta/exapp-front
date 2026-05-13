import {createContext, useContext, useEffect, useRef, useState} from 'react'
import {fetchStopwatch, resetStopwatch} from '../lib/api/stopwatch'

type TimerContextType = {
  time: number
  isActive: boolean
  toggle: () => void
  reset: () => void
  setTime: (ms: number) => void
  setIsActive: (active: boolean) => void
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeRef = useRef(0)

  // timeRef を常に最新の time と同期させる
  useEffect(() => {
    timeRef.current = time
  }, [time])

  // アプリ起動時に一度だけサーバー状態を同期する
  useEffect(() => {
    fetchStopwatch()
      .then((res) => {
        setTime(res.elapsedSeconds * 1000)
        setIsActive(res.isRunning)
      })
      .catch(() => {})
  }, [])

  // isActive 変化時、timeRef 経由で最新の elapsed を確実に捕捉する
  useEffect(() => {
    if (isActive) {
      const startTime = Date.now() - timeRef.current
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTime)
      }, 10)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive])

  const toggle = () => setIsActive((prev) => !prev)
  const reset = () => {
    setIsActive(false)
    setTime(0)
    resetStopwatch().catch(() => {})
  }

  return (
    <TimerContext.Provider value={{ time, isActive, toggle, reset, setTime, setIsActive }}>
      {children}
    </TimerContext.Provider>
  )
}

export const useTimer = () => {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider')
  return ctx
}
