import { useRef, useState, useEffect } from 'react'
import imageCompression from 'browser-image-compression'
import { ProblemForm } from './ProblemForm'
import type { AnalysisResponse, ProblemInput, SubCategory } from '../../types/workspace'
import { analyzeImage } from '../../lib/api/problem'
import { c } from '../../styles/notion'

type Props = {
    onSubmit: (input: ProblemInput) => Promise<void>
    onClose: () => void
    subCategories?: SubCategory[]
}

// ── 進捗メッセージ（2秒ごとにローテーション）─────────────────────────────────
const LOADING_MESSAGES = [
    'Geminiが問題を読み取っています...',
    'テキストを解析中...',
    '要点を抽出中...',
    'データを整理しています...',
    'もうすぐ完了します...',
]

// ── 画像変換ヘルパー ──────────────────────────────────────────────────────────
async function convertAndCompress(file: File): Promise<File> {
    const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: false, // iOS Safari での HEIC 変換を安定させる
        fileType: 'image/jpeg',
        initialQuality: 0.85,
    })
    const safeName = file.name.replace(/\.[^.]+$/, '.jpg')
    return new File([compressed], safeName, { type: 'image/jpeg' })
}

export function AddProblemModal({ onSubmit, onClose, subCategories = [] }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [prefill, setPrefill] = useState<ProblemInput | undefined>(undefined)
    const [prefillKey, setPrefillKey] = useState(0)

    const [analyzing, setAnalyzing] = useState(false)
    const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
    const [analysisError, setAnalysisError] = useState<string | null>(null)

    useEffect(() => {
        if (!analyzing) { setLoadingMsgIdx(0); return }
        const id = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 2000)
        return () => clearInterval(id)
    }, [analyzing])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ''

        setAnalyzing(true)
        setAnalysisError(null)

        try {
            const converted = await convertAndCompress(file)

            // API呼び出し（戻り値は保存済みモデルではなく解析データの配列）
            const result: AnalysisResponse = await analyzeImage(converted)

            // ProblemInput 形式にマッピング
            const input: ProblemInput = {
                subject:      result.subject_name ?? '',
                subCategory:    result.sub_category_name ?? '',
                questionRef:    result.question_ref ?? '',
                note:           result.note ?? '',
                proficiency:    result.proficiency as any,
                failureTypes:   result.failure_types as any[],
                isGoodQuestion: result.is_good_question,
                solvedAt:       result.solved_at,
                // 以下、解析に含まれないものは初期値をセット
                materialId:     undefined,
            }

            setPrefill(input)
            setPrefillKey((k) => k + 1)
        } catch (err) {
            console.error('Analysis failed:', err)
            setAnalysisError('AI解析に失敗しました。画像が不鮮明か、サーバーが混み合っている可能性があります。')
        } finally {
            setAnalyzing(false)
        }
    }

    const cameraButton = (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={cameraBtn}
                title="画像をAIで解析して自動入力"
                disabled={analyzing}
            >
                <CameraIcon />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>AI解析</span>
            </button>
        </>
    )

    return (
        <div style={overlay} role="dialog" aria-modal="true">
            <div style={panel}>
                <div style={header}>
                    <span style={titleStyle}>新規弱点登録</span>
                    <button onClick={onClose} style={closeBtn}>×</button>
                </div>

                {analyzing && (
                    <div style={loadingOverlay}>
                        <div style={spinnerWrap}>
                            <Spinner />
                            <p style={loadingText}>{LOADING_MESSAGES[loadingMsgIdx]}</p>
                            <p style={loadingHint}>しばらくお待ちください</p>
                        </div>
                    </div>
                )}

                <div style={body}>
                    {analysisError && (
                        <div style={errorBanner}>
                            <span>⚠ {analysisError}</span>
                            <button onClick={() => setAnalysisError(null)} style={errorDismiss}>×</button>
                        </div>
                    )}

                    {prefill && !analyzing && (
                        <div style={aiBanner}>
                            ✦ AI解析の結果を反映しました。内容を確認して保存してください。
                        </div>
                    )}

                    <ProblemForm
                        key={prefillKey}
                        initial={prefill}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        subCategories={subCategories}
                        leftAction={cameraButton}
                    />
                </div>
            </div>
        </div>
    )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CameraIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    )
}

function Spinner() {
    return (
        <svg
            width="36" height="36" viewBox="0 0 36 36"
            style={{ animation: 'spin 0.8s linear infinite' }}
        >
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(35,131,226,0.15)" strokeWidth="3" />
            <path d="M18 4 a14 14 0 0 1 14 14" fill="none" stroke="#2383e2" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(15, 15, 15, 0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, padding: '16px',
}

const panel: React.CSSProperties = {
    backgroundColor: c.bg, borderRadius: '8px',
    width: '100%', maxWidth: '520px', maxHeight: '85vh',
    overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
    position: 'relative',
}

const header: React.CSSProperties = {
    padding: '16px 20px', borderBottom: `1px solid ${c.border}`,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'sticky', top: 0, backgroundColor: c.bg, zIndex: 1,
}

const titleStyle: React.CSSProperties = { fontWeight: 600, fontSize: '15px' }

const closeBtn: React.CSSProperties = {
    background: 'none', border: 'none', fontSize: '20px',
    color: c.textSub, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
}

const body: React.CSSProperties = { padding: '20px' }

const loadingOverlay: React.CSSProperties = {
    position: 'absolute', inset: 0, zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '8px',
}

const spinnerWrap: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    padding: '0 24px', textAlign: 'center',
}

const loadingText: React.CSSProperties = {
    fontSize: '13px', fontWeight: 600,
    color: 'rgba(55, 53, 47, 0.7)', margin: 0,
    transition: 'opacity 0.3s ease',
}

const loadingHint: React.CSSProperties = {
    fontSize: '11px', color: 'rgba(55, 53, 47, 0.35)', margin: 0,
}

const aiBanner: React.CSSProperties = {
    marginBottom: '16px', padding: '8px 12px',
    backgroundColor: 'rgba(35, 131, 226, 0.06)',
    border: '1px solid rgba(35, 131, 226, 0.15)',
    borderRadius: '6px', fontSize: '12px',
    color: '#2383e2', fontWeight: 500,
}

const errorBanner: React.CSSProperties = {
    marginBottom: '16px', padding: '8px 12px',
    backgroundColor: 'rgba(235, 87, 87, 0.06)',
    border: '1px solid rgba(235, 87, 87, 0.15)',
    borderRadius: '6px', fontSize: '12px', color: '#eb5757',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
}

const errorDismiss: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '16px', color: '#eb5757', padding: '0 2px', flexShrink: 0,
}

const cameraBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 10px', borderRadius: '5px',
    border: '1px solid rgba(55, 53, 47, 0.16)',
    backgroundColor: 'transparent',
    color: 'rgba(55, 53, 47, 0.55)',
    cursor: 'pointer', fontSize: '13px',
    transition: 'background 0.15s, color 0.15s',
}
