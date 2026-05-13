import {useRef} from 'react'
import {useImageAnalysis} from "@/components/aiAgent/AiimageAnalyzeHook.ts";

type Props = {
    onAnalyzed: (input: any) => void
    disabled?: boolean
}

export function AiImageAnalyzeButton({ onAnalyzed, disabled }: Props) {
    const fileRef = useRef<HTMLInputElement>(null)
    const { run, analyzing, loadingMsgIdx } = useImageAnalysis()

    async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ''

        const result = await run(file)
        if (result) onAnalyzed(result)
    }

    return (
        <>
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onChange}
            />

            <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={disabled || analyzing}
                style={{
                    ...btn,
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
            >
                📷 AI解析
            </button>

            {analyzing && (
                <div style={loading}>
                    {['解析中...', '処理中...', 'もうすぐ完了'][loadingMsgIdx]}
                </div>
            )}
        </>
    )
}

const btn: React.CSSProperties = {
    padding: '6px 10px',
    border: '1px solid rgba(0,0,0,0.15)',
    borderRadius: '6px',
    background: 'transparent',
    cursor: 'pointer',
}

const loading: React.CSSProperties = {
    marginTop: 6,
    fontSize: 11,
    color: 'rgba(0,0,0,0.5)',
}