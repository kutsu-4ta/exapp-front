import {useRef, useState} from 'react'
import {useSettingsStore} from '../../lib/store/settings'
import type {FailureType, Problem, ProblemInput, Proficiency, SubCategory,} from '../../types/workspace'
import {todayString} from '../../types/workspace'

import {
    editableRow,
    errorStyle,
    flexRow,
    flexRowSecondary,
    notionDisabledSaveBtn,
    notionMainInp,
    notionSaveBtn,
    notionSubInp,
    tinyLabel,
} from '@/components/workspace/StudyBlockRow.styles.ts'

import {ProficiencySelector} from '@/components/common/ProficiencySelector.tsx'
import {FailureTypeSelector} from '@/components/common/FailureTypeSlecter.tsx'

type Props = {
    initial?: Partial<ProblemInput>
    subCategories: SubCategory[]
    onCancel: () => void
    onNext: (input: ProblemInput) => Promise<Problem>
    onNextWithAI: (input: ProblemInput, file:File) => Promise<Problem>
}

const LOADING_MESSAGES = [
    '画像を読み取っています...',
    'テキスト解析中...',
    '要点抽出中...',
    '整理しています...',
    'もうすぐ完了します...',
]

export function ProblemMetaStep({
                                    initial,
                                    subCategories,
                                    onCancel,
                                    onNext,
                                    onNextWithAI,
                                }: Props) {
    const subjects = useSettingsStore((s) => s.subjects)
    const materials = useSettingsStore((s) => s.materials)

    const [subject, setSubject] = useState(initial?.subject ?? '')
    const [subCategory, setSubCategory] = useState(initial?.subCategory ?? '')
    const [material, setMaterial] = useState(initial?.materialName ?? '')
    const [questionRef, setQuestionRef] = useState(initial?.questionRef ?? '')

    const [failureTypes, setFailureTypes] = useState<FailureType[]>(
        (initial?.failureTypes as FailureType[]) ?? []
    )

    const [proficiency, setProficiency] = useState<Proficiency>(
        (initial?.proficiency as Proficiency) ?? '×'
    )

    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [loadingMsgIdx, setLoadingMsgIdx] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)

    const fileRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<number | null>(null)

    function isValid(): boolean {
        return (
            subject.trim() !== '' &&
            subCategory.trim() !== '' &&
            questionRef.trim() !== '' &&
            failureTypes.length > 0
        )
    }

    const isInvalid = !isValid()

    function validate(): boolean {
        if (!subject.trim()) return setError('科目を入力してください'), false
        if (!subCategory.trim()) return setError('小分類を入力してください'), false
        if (!questionRef.trim()) return setError('問題番号を入力してください'), false
        if (failureTypes.length === 0) return setError('属性を選択してください'), false
        return true
    }

    function buildPayload(): ProblemInput {
        return {
            subject: subject.trim(),
            materialId: null,
            materialName: material.trim() || null,
            subCategory: subCategory.trim(),
            questionRef: questionRef.trim(),
            note: initial?.note ?? null,
            defeatReason: null,
            proficiency,
            failureTypes,
            isGoodQuestion: false,
            solvedAt: todayString(),
        }
    }

    async function handleNext() {
        if (!validate()) return

        setError(null)
        setLoading(true)

        try {
            await onNext(buildPayload())
        } catch (e) {
            setError(e instanceof Error ? e.message : '作成失敗')
        } finally {
            setLoading(false)
        }
    }

    function startMessageLoop() {
        timerRef.current = window.setInterval(() => {
            setLoadingMsgIdx((i: number) => (i + 1) % LOADING_MESSAGES.length)
        }, 2000)
    }

    function stopMessageLoop() {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    async function handleAINext(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ''

        if (!validate()) return

        setError(null)
        setAnalyzing(true)
        setLoadingMsgIdx(0)
        startMessageLoop()

        try {
            await onNextWithAI(buildPayload(), file)
        } catch (e) {
            setError(e instanceof Error ? e.message : '作成失敗')
        } finally {
            stopMessageLoop()
            setAnalyzing(false)
            setLoading(false)
        }
    }

    return (
        <div style={editableRow}>
            <div style={flexRow}>
                <input
                    list="subjects"
                    value={subject}
                    onChange={(e) => {
                        setSubject(e.target.value)
                        setSubCategory('')
                    }}
                    placeholder="科目"
                    style={notionMainInp}
                />
                <datalist id="subjects">
                    {subjects.map((s) => (
                        <option key={s} value={s} />
                    ))}
                </datalist>

                <input
                    list="materials"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="教材"
                    style={notionSubInp}
                />
                <datalist id="materials">
                    {materials.map((m) => (
                        <option key={m} value={m} />
                    ))}
                </datalist>
            </div>

            <div style={flexRowSecondary}>
                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <span style={tinyLabel}>SUB</span>
                    <input
                        list="subcats"
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        placeholder="小分類"
                        style={notionSubInp}
                    />
                    <span style={tinyLabel}>MAT</span>
                </div>

                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <input
                        value={questionRef}
                        onChange={(e) => setQuestionRef(e.target.value)}
                        placeholder="問題番号"
                        style={notionSubInp}
                    />
                </div>
            </div>

            <datalist id="subcats">
                {subCategories
                    .filter((x) => x.subject === subject)
                    .map((x) => (
                        <option key={x.id} value={x.name} />
                    ))}
            </datalist>

            <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={tinyLabel}>習熟度</span>
                    <ProficiencySelector value={proficiency} onChange={setProficiency} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '12px' }}>
                <FailureTypeSelector value={failureTypes} onChange={setFailureTypes} />
            </div>

            {error && <p style={errorStyle}>{error}</p>}

            {analyzing && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.6 }}>
                    {LOADING_MESSAGES[loadingMsgIdx]}
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 8,
                    marginTop: '20px',
                }}
            >

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAINext}
                />

                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={loading || analyzing || isInvalid}
                    style={(loading || isInvalid) ? notionDisabledSaveBtn : notionSaveBtn}
                >
                    {loading ? '作成中...' : 'AIでnotes生成'}
                </button>

                <button
                    onClick={handleNext}
                    disabled={loading || isInvalid}
                    style={(loading || isInvalid) ? notionDisabledSaveBtn : notionSaveBtn}
                >
                    {loading ? '作成中...' : '次へ'}
                </button>
            </div>
        </div>
    )
}