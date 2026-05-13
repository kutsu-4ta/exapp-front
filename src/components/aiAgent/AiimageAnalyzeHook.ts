import {useRef, useState} from 'react'
import {analyzeImage} from '@/lib/api/problem'

const ALLOWED_INPUT_TYPES = new Set([
    'image/jpeg','image/png','image/webp','image/gif',
    'image/heic','image/heif','image/bmp','image/tiff',
])

const LOADING_MESSAGES = [
    '画像を読み取っています...',
    'テキスト解析中...',
    '要点抽出中...',
    '整理しています...',
    'もうすぐ完了します...',
]

export function useImageAnalysis() {
    const [analyzing, setAnalyzing] = useState(false)
    const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)

    const timerRef = useRef<number | null>(null)

    function startMessageLoop() {
        timerRef.current = window.setInterval(() => {
            setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
        }, 2000)
    }

    function stopMessageLoop() {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    async function run(file: File): Promise<ProblemInput | null> {
        setAnalyzing(true)
        setLoadingMsgIdx(0)
        startMessageLoop()

        try {
            console.log('before api')

            const result: AnalysisResponse = await analyzeImage(file)

            console.log('after api', result)

            return {
                subject: result.subject_name ?? '',
                materialId: null,
                materialName: '',
                subCategory: result.sub_category_name || null,
                questionRef: result.question_ref ?? '',
                note: result.note ?? '',
                defeatReason: null,
                proficiency: result.proficiency as any,
                failureTypes: result.failure_types as any[],
                isGoodQuestion: result.is_good_question,
                solvedAt: result.solved_at,
            }
        } catch (e) {
            console.error(e)
            return null
        } finally {
            stopMessageLoop()
            setAnalyzing(false)
        }
    }

    return {
        run,
        analyzing,
        loadingMsgIdx,
    }
}