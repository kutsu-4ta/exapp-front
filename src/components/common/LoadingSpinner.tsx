type Size = 'sm' | 'md' | 'lg'

type Props = {
    size?: Size
    fullPage?: boolean
}

// 1フレームあたりの高さ・ドット半径・ドット間隔・CSS アニメーション名
const CFG: Record<Size, { frameH: number; r: number; gap: number; animName: string }> = {
    sm: { frameH: 16, r: 2.5, gap: 5,  animName: 'sprite-sm' },
    md: { frameH: 24, r: 3.5, gap: 7,  animName: 'sprite-md' },
    lg: { frameH: 36, r: 5,   gap: 9,  animName: 'sprite-lg' },
}

// ping-pong: 左→中→右→中
const ACTIVE: [number, number, number, number] = [0, 1, 2, 1]
const FRAME_COUNT = ACTIVE.length

export function LoadingSpinner({ size = 'md', fullPage = false }: Props) {
    const { frameH, r, gap, animName } = CFG[size]

    // 3ドットのスプライト SVG 幅
    const dotStep = r * 2 + gap            // 1ドット分の横幅 + 間隔
    const svgW    = r * 2 + dotStep * 2    // 3ドット分の幅

    const totalH = frameH * FRAME_COUNT    // 全フレーム分の SVG 高さ

    // 全フレームの circle 要素を生成
    const circles = ACTIVE.flatMap((activeIdx, frameIdx) =>
        [0, 1, 2].map((dotIdx) => (
            <circle
                key={`${frameIdx}-${dotIdx}`}
                cx={r + dotIdx * dotStep}
                cy={frameIdx * frameH + frameH / 2}
                r={r}
                fill={dotIdx === activeIdx ? 'rgba(55,53,47,0.5)' : 'rgba(55,53,47,0.13)'}
            />
        ))
    )

    const sprite = (
        // コンテナ: 1フレーム分だけ見せる窓
        <div style={{ width: svgW, height: frameH, overflow: 'hidden', flexShrink: 0 }}>
            {/* 内側 SVG: steps() で translateY を駒送り */}
            <svg
                width={svgW}
                height={totalH}
                style={{
                    display: 'block',
                    animationName: animName,
                    animationTimingFunction: `steps(${FRAME_COUNT}, end)`,
                    animationDuration: '0.64s',
                    animationIterationCount: 'infinite',
                }}
            >
                {circles}
            </svg>
        </div>
    )

    if (fullPage) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
            }}>
                {sprite}
            </div>
        )
    }

    return sprite
}
