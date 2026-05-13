import {useEffect, useRef, useState} from 'react'

export type ExamTimer = {
  time: number
  isActive: boolean
  toggle: () => void
  reset: () => void
}

export function useExamTimer(): ExamTimer {
  const [time, setTime] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isActive) {
      const startTime = Date.now() - time
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
  }

  return { time, isActive, toggle, reset }
}
