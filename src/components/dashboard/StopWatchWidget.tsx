'use client'

import { useState, useEffect, useRef } from 'react'
import {todayString} from "@/types/workspace";
import {router} from "next/client";
import Link from "next/link";

export function StopWatchWidget() {
    const [time, setTime] = useState(0)
    const [isActive, setIsActive] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const toggle = () => setIsActive(!isActive)
    const reset = () => {
        setIsActive(false)
        setTime(0)
    }

    // 分単位に変換（1分未満は切り上げ）
    const minutes = Math.ceil(time / 60000)
    const logUrl = `/workspace/${todayString()}?minutes=${minutes}`

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTime((prev) => prev + 10)
            }, 10)
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isActive])

    const formatTime = () => {
        const hours = Math.floor(time / 3600000)
        const minutes = Math.floor((time % 3600000) / 60000)
        const seconds = Math.floor((time % 60000) / 1000)
        const ms = Math.floor((time % 1000) / 10)

        const hDisplay = hours > 0 ? `${hours}:` : ''
        const mDisplay = minutes < 10 && hours > 0 ? `0${minutes}` : minutes
        const sDisplay = seconds < 10 ? `0${seconds}` : seconds
        const msDisplay = ms < 10 ? `0${ms}` : ms

        return { main: `${hDisplay}${mDisplay}:${sDisplay}`, ms: `.${msDisplay}` }
    }

    const { main, ms } = formatTime()

    return (
        <div style={container}>
            <div style={timerDisplay}>
                {!isActive && time > 0 ? (
                    <Link href={logUrl} style={{ ...timeText, textDecoration: 'none' }}>
                        {main}<span style={msText}>{ms}</span>
                    </Link>
                ) : (
                    <div style={timeText}>
                        {main}<span style={msText}>{ms}</span>
                    </div>
                )}
                <div style={controls}>
                    {/* 再生 / 一時停止ボタン */}
                    <button onClick={toggle} style={isActive ? pauseBtn : playBtn}>
                        {isActive ? (
                            <span style={{ fontSize: '18px' }}>Ⅱ</span>
                        ) : (
                            <span style={{ fontSize: '16px', marginLeft: '2px' }}>▶</span>
                        )}
                    </button>

                    {/* 停止時のみ表示される「×」ボタン */}
                    {!isActive && time > 0 && (
                        <button onClick={reset} style={resetBtn}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

const container: React.CSSProperties = {
    marginBottom: '32px',
}

const timerDisplay: React.CSSProperties = {
    backgroundColor: '#0a0a1a',
    borderRadius: '40px',
    padding: '12px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
}

const controls: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
}

const buttonBase: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
}

const playBtn: React.CSSProperties = {
    ...buttonBase,
    backgroundColor: '#3a2a1a',
    color: '#ff9f0a'
}

const pauseBtn: React.CSSProperties = {
    ...buttonBase,
    backgroundColor: '#3a2a1a',
    color: '#ff9f0a'
}

const resetBtn: React.CSSProperties = {
    ...buttonBase,
    backgroundColor: '#2c2c3e',
    color: '#fff'
}

const timeText: React.CSSProperties = {
    fontSize: '42px', // 画像に合わせて少し大きく
    fontWeight: 300,
    color: '#ff9f0a',
    fontFamily: 'SF Mono, Menlo, monospace',
    letterSpacing: '0.02em',
}

const msText: React.CSSProperties = {
    fontSize: '32px',
    opacity: 0.9,
}