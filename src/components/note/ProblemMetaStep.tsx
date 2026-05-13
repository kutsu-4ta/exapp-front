import { useState } from 'react'
import { useSettingsStore } from '../../lib/store/settings'
import {
    FAILURE_TYPE_VALUES,
    todayString,
} from '../../types/workspace'
import type {
    FailureType,
    ProblemInput,
    SubCategory,
    Problem
} from '../../types/workspace'

type Props = {
    initial?: Partial<ProblemInput>
    subCategories: SubCategory[]
    onCancel: () => void
    onNext: (input: ProblemInput) => Promise<Problem>

}

export function ProblemMetaStep({
                                    initial,
                                    subCategories,
                                    onCancel,
                                    onNext,
                                }: Props) {
    const subjects = useSettingsStore((s) => s.subjects)
    const materials = useSettingsStore((s) => s.materials)

    const [subject, setSubject] = useState(initial?.subject ?? '')
    const [subCategory, setSubCategory] = useState(
        initial?.subCategory ?? ''
    )
    const [material, setMaterial] = useState(
        initial?.materialName ?? ''
    )
    const [questionRef, setQuestionRef] = useState(
        initial?.questionRef ?? ''
    )
    const [failureTypes, setFailureTypes] =
        useState<FailureType[]>(
            (initial?.failureTypes as FailureType[]) ?? []
        )

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleNext() {
        if (!subject.trim()) {
            setError('科目を入力してください')
            return
        }

        if (!subCategory.trim()) {
            setError('小分類を入力してください')
            return
        }

        if (!questionRef.trim()) {
            setError('問題番号を入力してください')
            return
        }

        if (failureTypes.length === 0) {
            setError('属性を選択してください')
            return
        }

        setError(null)
        setLoading(true)

        try {
            console.log('step1 submit')
            await onNext({
                subject: subject.trim(),
                materialId: null,
                materialName: material.trim() || null,
                subCategory: subCategory.trim(),
                questionRef: questionRef.trim(),
                note: null,
                defeatReason: null,
                proficiency: '×',
                failureTypes,
                isGoodQuestion: false,
                solvedAt: todayString(),
            })
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : '作成に失敗しました'
            )
        } finally {
            setLoading(false)
        }
    }

    function toggleFailureType(ft: FailureType) {
        setFailureTypes((prev) =>
            prev.includes(ft)
                ? prev.filter((x) => x !== ft)
                : [...prev, ft]
        )
    }

    return (
        <>
            <section>
                <label>科目</label>
                <input
                    list="subjects"
                    value={subject}
                    onChange={(e) => {
                        setSubject(e.target.value)
                        setSubCategory('')
                    }}
                />
                <datalist id="subjects">
                    {subjects.map((s) => (
                        <option key={s} value={s} />
                    ))}
                </datalist>
            </section>

            <section>
                <label>教材</label>
                <input
                    list="materials"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                />
                <datalist id="materials">
                    {materials.map((m) => (
                        <option key={m} value={m} />
                    ))}
                </datalist>
            </section>

            <section>
                <label>小分類（必須）</label>
                <input
                    list="subcats"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                />
                <datalist id="subcats">
                    {subCategories
                        .filter((x) => x.subject === subject)
                        .map((x) => (
                            <option key={x.id} value={x.name} />
                        ))}
                </datalist>
            </section>

            <section>
                <label>問題番号（必須）</label>
                <input
                    value={questionRef}
                    onChange={(e) =>
                        setQuestionRef(e.target.value)
                    }
                />
            </section>
            <section>
                <label>属性（必須）</label>

                <div style={pillWrap}>
                    {FAILURE_TYPE_VALUES.map((ft) => {
                        const selected =
                            failureTypes.includes(ft)

                        return (
                            <button
                                key={ft}
                                type="button"
                                onClick={() =>
                                    toggleFailureType(ft)
                                }
                                style={{
                                    ...pillBtn,
                                    backgroundColor: selected
                                        ? 'rgba(55,53,47,0.08)'
                                        : 'transparent',
                                    borderColor: selected
                                        ? 'rgba(55,53,47,0.16)'
                                        : 'rgba(55,53,47,0.09)',
                                    color: selected
                                        ? '#37352f'
                                        : 'rgba(55,53,47,0.45)',
                                }}
                            >
                                {ft}
                            </button>
                        )
                    })}
                </div>
            </section>

            {error && (
                <p style={{ color: '#eb5757' }}>{error}</p>
            )}

            <div style={actions}>
                <button onClick={onCancel}>
                    キャンセル
                </button>

                <button
                    onClick={handleNext}
                    disabled={loading}
                >
                    {loading ? '作成中...' : '次へ'}
                </button>
            </div>
        </>
    )
}

const actions = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 24,
}
const pillWrap = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '6px',
}

const pillBtn = {
    padding: '4px 12px',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '12px',
    cursor: 'pointer',
}