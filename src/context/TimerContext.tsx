import { createContext, useContext, useEffect, useRef, useState } from "react"
import { fetchStopwatch } from "../lib/api/stopwatch"

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

    // アプリ起動時に一度だけサーバー状態を同期する。
    // setTime + setIsActive を同一 Promise callback 内で呼ぶことで
    // React 18 の自動バッチングにより 1 回のレンダーにまとまり、
    // 下の useEffect が正しい elapsed time を捕捉できる。
    useEffect(() => {
        fetchStopwatch()
            .then((res) => {
                setTime(res.elapsedSeconds * 1000)
                setIsActive(res.isRunning)
            })
            .catch(() => {})
    }, [])

    // isActive が変化した render サイクルの time を捕捉して startTime を確定する。
    // これにより setInterval のドリフトに依存せず経過時間を正確に計算できる。
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
    }, [isActive]) // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = () => setIsActive((prev) => !prev)
    const reset = () => {
        setIsActive(false)
        setTime(0)
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
