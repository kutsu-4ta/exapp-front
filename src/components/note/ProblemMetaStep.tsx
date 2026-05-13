import {useState} from 'react'
import {useSettingsStore} from '../../lib/store/settings'
import {todayString,} from '../../types/workspace'
import type {
    FailureType,
    ProblemInput,
    Problem,
    SubCategory,
    Proficiency,
} from '../../types/workspace'
import {
    editableRow, errorStyle,
    flexRow,
    flexRowSecondary, notionDeleteBtn,
    notionMainInp, notionSaveBtn,
    notionSubInp, tinyLabel
} from "@/components/workspace/StudyBlockRow.styles.ts";
import {ProficiencySelector} from "@/components/common/ProficiencySelector.tsx";
import {FailureTypeSelector} from "@/components/common/FailureTypeSlecter.tsx";

type Props = {
    initial?: Partial<ProblemInput>
    subCategories: SubCategory[]
    onCancel: () => void
    onNext: (
        input: ProblemInput
    ) => Promise<Problem>
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
    const [subCategory, setSubCategory,] = useState(initial?.subCategory ?? '')
    const [material, setMaterial] = useState(initial?.materialName ?? '')
    const [questionRef, setQuestionRef,] = useState(initial?.questionRef ?? '')
    const [failureTypes, setFailureTypes,] = useState<FailureType[]>((initial?.failureTypes as FailureType[]) ?? [])
    const [proficiency, setProficiency] = useState<Proficiency>((initial?.proficiency as Proficiency) ?? '×')
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

        if (
            failureTypes.length ===
            0
        ) {
            setError('属性を選択してください')
            return
        }

        setError(null)
        setLoading(true)

        try {
            await onNext({
                subject: subject.trim(),
                materialId: null,
                materialName: material.trim() || null,
                subCategory: subCategory.trim(),
                questionRef: questionRef.trim(),
                note: null,
                defeatReason: null,
                proficiency,
                failureTypes,
                isGoodQuestion: false,
                solvedAt: todayString(),
            })
        } catch (e) {
            setError(e instanceof Error ? e.message : '作成失敗')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={editableRow}>
            <div style={flexRow}>
                <input list="subjects"
                       value={subject}
                       onChange={(e) => {
                           setSubject(e.target.value)
                           setSubCategory('')
                       }}
                       placeholder="科目"
                       style={notionMainInp}
                />
                <datalist id="subjects">
                    {subjects.map((s) => (<option key={s} value={s}/>))}
                </datalist>

                <input
                    list="materials"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="教材"
                    style={notionSubInp}
                />
                <datalist id="materials">
                    {materials.map((m) => (<option key={m} value={m}/>))}
                </datalist>

            </div>

            <div style={                 flexRowSecondary}>
                <div style={{flex: 1, display: 'flex', gap: 8,}}>
                    <span style={tinyLabel}>SUB</span>

                    <input list="subcats"
                           value={subCategory}
                           onChange={(e) => setSubCategory(e.target.value)}
                           placeholder="小分類"
                           style={notionSubInp}
                    />

                    <span style={tinyLabel}>MAT</span>
                </div>

                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        gap: 8,
                    }}
                >
                    <input
                        value={                         questionRef}
                        onChange={(e) =>
                            setQuestionRef(e.target.value)}
                        placeholder="問題番号"
                        style={                         notionSubInp}
                    />
                </div>
            </div>

            <datalist id="subcats">
                {subCategories
                    .filter(
                        (x) =>
                            x.subject ===
                            subject
                    )
                    .map((x) => (
                        <option
                            key={
                                x.id
                            }
                            value={
                                x.name
                            }
                        />
                    ))}
            </datalist>

            <div style={{marginTop: '12px'}}>
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        marginBottom: '8px',
                    }}
                >
                    <span style={tinyLabel}>習熟度</span>
                    <ProficiencySelector
                        value={proficiency}
                        onChange={setProficiency}
                    />
                </div>
            </div>

            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '12px',}}>
                <FailureTypeSelector
                    value={failureTypes}
                    onChange={
                        setFailureTypes
                    }
                />
            </div>

            {error && (
                <p
                    style={
                        errorStyle
                    }
                >
                    {error}
                </p>
            )}

            <div
                style={{
                    display:
                        'flex',
                    justifyContent:
                        'flex-end',
                    gap: 8,
                    marginTop:
                        '20px',
                }}
            >
                <button
                    onClick={
                        onCancel
                    }
                    style={
                        notionDeleteBtn
                    }
                >
                    キャンセル
                </button>

                <button
                    onClick={
                        handleNext
                    }
                    disabled={
                        loading
                    }
                    style={
                        notionSaveBtn
                    }
                >
                    {loading
                        ? '作成中...'
                        : '次へ'}
                </button>
            </div>
        </div>
    )
}