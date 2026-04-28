'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

type TimerContextType = {
    time: number
    isActive: boolean
    toggle: () => void
    reset: () => void
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [time, setTime] = useState(0)
    const [isActive, setIsActive] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

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

    const toggle = () => setIsActive(!isActive)
    const reset = () => {
        setIsActive(false)
        setTime(0)
    }

    return (
        <TimerContext.Provider value={{ time, isActive, toggle, reset }}>
            {children}
        </TimerContext.Provider>
    )
}

export const useTimer = () => {
    const context = useContext(TimerContext)
    if (!context) throw new Error('useTimer must be used within a TimerProvider')
    return context
}