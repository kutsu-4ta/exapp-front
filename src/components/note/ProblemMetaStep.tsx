import {useEffect, useRef, useState} from 'react'
import {useSettingsStore} from '../../lib/store/settings'
import type {FailureType, Problem, ProblemInput, Proficiency, SubCategory,} from '../../types/workspace'
import {todayString} from '../../types/workspace'

import {
    editableRow,
    errorStyle,
    flexRow,
    notionDisabledSaveBtn,
    notionMainInp,
    notionSaveBtn,
    notionSubInp,
    tinyLabel,
} from '@/components/workspace/StudyBlockRow.styles.ts'

import {ProficiencySelector} from '@/components/common/ProficiencySelector.tsx'
import {FailureTypeSelector} from '@/components/common/FailureTypeSlecter.tsx'
import {fetchProblems} from '@/lib/api/problem.ts'
import {Star} from 'lucide-react'
import {ProblemQuickModal} from '@/components/note/ProblemQuickModal.tsx'

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
                                    onNext,
                                    onNextWithAI,
                                }: Props) {
    const subjects = useSettingsStore((s) => s.subjects)
    const materials = useSettingsStore((s) => s.materials)
    const lastUsedMaterial = useSettingsStore((s) => s.lastUsedMaterial)
    const setLastUsedMaterial = useSettingsStore((s) => s.setLastUsedMaterial)

    const [subject, setSubject] = useState(initial?.subject ?? '')
    const [subCategory, setSubCategory] = useState(initial?.subCategory ?? '')
    const [material, setMaterial] = useState(initial?.materialName ?? lastUsedMaterial)
    const [questionRef, setQuestionRef] = useState(initial?.questionRef ?? '')

    const [failureTypes, setFailureTypes] = useState<FailureType[]>(
        (initial?.failureTypes as FailureType[]) ?? []
    )

    const [proficiency, setProficiency] = useState<Proficiency>(
        (initial?.proficiency as Proficiency) ?? '×'
    )

    const [isFormula, setIsFormula] = useState(initial?.isFormula ?? false)
    const [isGoodQuestion, setIsGoodQuestion] = useState(initial?.isGoodQuestion ?? false)

    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [loadingMsgIdx, setLoadingMsgIdx] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)
    const [dupProblem, setDupProblem] = useState<Problem | null>(null)
    const [dupModalOpen, setDupModalOpen] = useState(false)

    const fileRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<number | null>(null)
    const dupDebounceRef = useRef<number | null>(null)
    const isFirstRenderRef = useRef(true)

    async function searchDuplicate(mat: string, ref: string, subj: string) {
        if (!mat.trim() || !ref.trim()) {
            setDupProblem(null)
            return
        }
        try {
            const results = await fetchProblems({ q: ref, limit: 50 })
            const found = results.find(
                (p) =>
                    p.subject.trim() === subj.trim() &&
                    p.materialName?.trim() === mat.trim() &&
                    p.questionRef.trim() === ref.trim()
            )
            setDupProblem(found ?? null)
        } catch {
            // silently ignore search errors
        }
    }

    // マウント時に即時検索
    useEffect(() => {
        searchDuplicate(material, questionRef, subject)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 教材・問題番号の変更を 600ms デバウンスで検索
    useEffect(() => {
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false
            return
        }
        if (dupDebounceRef.current) clearTimeout(dupDebounceRef.current)
        dupDebounceRef.current = window.setTimeout(() => {
            searchDuplicate(material, questionRef, subject)
        }, 600)
        return () => {
            if (dupDebounceRef.current) clearTimeout(dupDebounceRef.current)
        }
    }, [material, questionRef, subject])

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
            proficiency,
            failureTypes,
            isGoodQuestion,
            isFormula,
            solvedAt: todayString(),
        }
    }

    async function handleNext() {
        if (!validate()) return

        setError(null)
        setLoading(true)

        try {
            const payload = buildPayload()
            if (payload.materialName) setLastUsedMaterial(payload.materialName)
            await onNext(payload)
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

        setError(null)
        setAnalyzing(true)
        setLoadingMsgIdx(0)
        startMessageLoop()

        try {
            await onNextWithAI(buildPayload(), file)
        } catch (e) {
            setError('AI解析に失敗しました（手動入力で続行できます）')
        } finally {
            stopMessageLoop()
            setAnalyzing(false)
            setLoading(false)
        }
    }

    return (
        <div style={editableRow}>
            {/* 科目（必須） */}
            <input
                list="subjects"
                value={subject}
                onChange={(e) => {
                    setSubject(e.target.value)
                    setSubCategory('')
                }}
                placeholder="科目 *"
                style={{ ...notionMainInp, width: '100%' }}
            />
            <datalist id="subjects">
                {subjects.map((s) => (
                    <option key={s} value={s} />
                ))}
            </datalist>

            {/* 教材（任意） */}
            <input
                list="materials"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="教材"
                style={{ ...notionSubInp, flex: 1, width: 'auto' }}
            />
            <datalist id="materials">
                {materials.map((m) => (
                    <option key={m} value={m} />
                ))}
            </datalist>

            {/* 小分類（必須）— key={subject} で科目変更時に datalist を強制再生成 */}
            <input
                list="subcats"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="小分類 *"
                style={notionSubInp}
            />
            <datalist id="subcats" key={subject}>
                {subCategories
                    .filter((x) => x.subject === subject.trim())
                    .map((x) => (
                        <option key={x.id} value={x.name} />
                    ))}
            </datalist>

            {/* 問題番号（必須） */}
            <div style={flexRow}>
                <input
                    value={questionRef}
                    onChange={(e) => setQuestionRef(e.target.value)}
                    placeholder="問題番号 *"
                    style={{ ...notionSubInp, flex: 1, width: 'auto' }}
                />
            </div>

            {/* 重複警告バナー */}
            {dupProblem && (
                <div style={dupWarningStyle}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>⚠ 同じ教材・問題番号が既に登録されています</span>
                    <span style={{ fontSize: 12 }}>
                        {[dupProblem.materialName, dupProblem.questionRef].filter(Boolean).join(' · ')}
                        {dupProblem.subCategory ? ` — ${dupProblem.subCategory}` : ''}
                    </span>
                    <button
                        type="button"
                        onClick={() => setDupModalOpen(true)}
                        style={dupViewBtnStyle}
                    >
                        登録済みノートを見る →
                    </button>
                </div>
            )}

            {/* 重複ノート詳細（URL変更なし・演習フローを維持） */}
            {dupProblem && dupModalOpen && (
                <ProblemQuickModal
                    problem={dupProblem}
                    onClose={() => setDupModalOpen(false)}
                    onDelete={() => {
                        setDupProblem(null)
                        setDupModalOpen(false)
                    }}
                    onUpdate={(updated) => setDupProblem(updated)}
                    hideQuizzes
                    zIndex={3000}
                />
            )}

            <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={tinyLabel}>習熟度</span>
                    <ProficiencySelector
                        mode="single"
                        value={proficiency}
                        onChange={setProficiency}
                    />
                </div>
            </div>

            <div style={{ marginTop: '12px' }}>
                <span style={{ ...tinyLabel, display: 'block', marginBottom: '6px' }}>属性 *</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <FailureTypeSelector value={failureTypes} onChange={setFailureTypes} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: '10px' }}>
                <button
                    type="button"
                    onClick={() => setIsFormula((v) => !v)}
                    style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderColor: isFormula ? 'rgba(35,131,226,0.4)' : 'rgba(55,53,47,0.15)',
                        backgroundColor: isFormula ? 'rgba(35,131,226,0.07)' : 'transparent',
                        color: isFormula ? 'rgba(35,131,226,1)' : 'rgba(55,53,47,0.4)',
                        transition: 'all 0.15s',
                    }}
                >
                    公式
                </button>
                <button
                    type="button"
                    onClick={() => setIsGoodQuestion((v) => !v)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderColor: isGoodQuestion ? 'rgba(234,179,8,0.4)' : 'rgba(55,53,47,0.15)',
                        backgroundColor: isGoodQuestion ? 'rgba(254,249,195,0.6)' : 'transparent',
                        color: isGoodQuestion ? '#92400e' : 'rgba(55,53,47,0.4)',
                        transition: 'all 0.15s',
                    }}
                >
                    <Star size={12} fill={isGoodQuestion ? 'currentColor' : 'none'} />
                    良問
                </button>
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
                    style={(loading || analyzing || isInvalid) ? notionDisabledSaveBtn : notionSaveBtn}
                >
                    {loading ? '作成中...' : 'AIでnotes生成'}
                </button>

                <button
                    onClick={handleNext}
                    disabled={loading || analyzing || isInvalid}
                    style={(loading || analyzing || isInvalid) ? notionDisabledSaveBtn : notionSaveBtn}
                >
                    {loading ? '作成中...' : '次へ'}
                </button>
            </div>
        </div>
    )
}

const dupWarningStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(234,179,8,0.4)',
    backgroundColor: 'rgba(254,249,195,0.7)',
    color: '#92400e',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
}

const dupViewBtnStyle: React.CSSProperties = {
    alignSelf: 'flex-start',
    background: 'none',
    border: '1px solid rgba(234,179,8,0.5)',
    borderRadius: '5px',
    color: '#92400e',
    fontSize: '12px',
    fontWeight: 600,
    padding: '3px 10px',
    cursor: 'pointer',
    marginTop: '2px',
}
