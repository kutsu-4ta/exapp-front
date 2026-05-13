import { useState } from 'react'
import type { Problem, ProblemInput, SubCategory } from '../../types/workspace'
import { c } from '../../styles/notion'
import { ProblemNoteStep } from '@/components/note/ProblemNoteStep'
import { ProblemMetaStep } from '@/components/note/ProblemMetaStep'

type Props = {
    onClose: () => void
    onSubmit: (input: ProblemInput) => Promise<Problem>
    onUpdate: (id: number, input: ProblemInput) => Promise<Problem>
    subCategories?: SubCategory[]
    initial?: Partial<ProblemInput>
}

type Step = 'meta' | 'note'

export function AddProblemModal({
                                    onClose,
                                    onSubmit,
                                    onUpdate,
                                    subCategories = [],
                                    initial,
                                }: Props) {
    const [step, setStep] = useState<Step>('meta')

    // 作成済み Problem を保持
    const [problem, setProblem] = useState<Problem | null>(null)

    async function handleMetaNext(input: ProblemInput) {
        const created = await onSubmit(input)

        setProblem(created)
        setStep('note')
    }

    async function handleNoteSave(note: string) {
        if (!problem) return

        const updated = await onUpdate(problem.id, {
            ...problem,
            note,
        })

        setProblem(updated)
    }

    if (step === 'meta') {
        return (
            <ModalShell title="新規ノート登録" onClose={onClose}>
                <ProblemMetaStep
                    initial={initial}
                    subCategories={subCategories}
                    onCancel={onClose}
                    onNext={handleMetaNext}
                />
            </ModalShell>
        )
    }

    if (!problem) return null

    return (
        <ModalShell title="ノート編集" onClose={onClose}>
            <ProblemNoteStep
                problem={problem}
                onAutoSave={handleNoteSave}
                onClose={onClose}
            />
        </ModalShell>
    )
}

function ModalShell({
                        title,
                        children,
                        onClose,
                    }: {
    title: string
    children: React.ReactNode
    onClose: () => void
}) {
    return (
        <div style={overlay}>
            <div style={panel}>
                <div style={header}>
                    <span>{title}</span>
                    <button onClick={onClose} style={closeBtn}>
                        ×
                    </button>
                </div>

                <div style={{ padding: 20 }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

const overlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.55)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 2000,
} as const

const panel = {
    background: c.bg,
    width: '100%',
    maxWidth: 520,
    borderRadius: 8,
} as const

const header = {
    padding: '16px 20px',
    borderBottom: `1px solid ${c.border}`,
    display: 'flex',
    justifyContent: 'space-between',
} as const

const closeBtn = {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
} as const