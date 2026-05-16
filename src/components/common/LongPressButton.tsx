import {useEffect, useRef, useState} from "react"
import {hapticSuccess} from "@/components/common/utilFunctions.ts";

type Props = {
    onConfirm: () => void
    durationMs?: number
    disabled?: boolean
    children: React.ReactNode
    style?: React.CSSProperties
}

export function LongPressButton({
                                    onConfirm,
                                    durationMs = 2000,
                                    disabled,
                                    children,
                                    style,
                                }: Props) {
    const [progress, setProgress] = useState(0)
    const [pressing, setPressing] = useState(false)
    const rafRef = useRef<number | null>(null)
    const startTimeRef = useRef<number>(0)

    const start = () => {
        if (disabled) return
        setPressing(true)
        startTimeRef.current = performance.now()

        const tick = () => {
            const elapsed = performance.now() - startTimeRef.current
            const next = Math.min(elapsed / durationMs, 1)

            setProgress(next)

            if (next >= 1) {
                setPressing(false)
                setProgress(0)

                // 成功時ハプティック
                hapticSuccess()
                onConfirm()
                return
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
    }

    const cancel = () => {
        setPressing(false)
        setProgress(0)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }

    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    return (
        <button
            style={{
                ...baseStyle,
                ...style,
                position: "relative",
                overflow: "hidden",
                opacity: disabled ? 0.5 : 1,
            }}
            disabled={disabled}
            onMouseDown={start}
            onMouseUp={cancel}
            onMouseLeave={cancel}
            onTouchStart={start}
            onTouchEnd={cancel}
        >
            {/* プログレス背景 */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${progress * 100}%`,
                    background: "rgba(255, 0, 0, 0.15)",
                    transition: pressing ? "none" : "width 0.2s ease",
                }}
            />

            {/* ラベル */}
            <span style={{ position: "relative", zIndex: 1 }}>
                {children}
            </span>
        </button>
    )
}

const baseStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(0,0,0,0.1)",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
    userSelect: "none",
}