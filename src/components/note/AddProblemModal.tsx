import {useState} from 'react'
import type {Problem, ProblemInput, SubCategory} from '../../types/workspace'
import {c} from '../../styles/notion'
import {ProblemNoteStep} from '@/components/note/ProblemNoteStep'
import {ProblemMetaStep} from '@/components/note/ProblemMetaStep'
import {analyzeImage, deleteProblem} from "@/lib/api/problem.ts";
import imageCompression from 'browser-image-compression'

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

  const [problem, setProblem] = useState<Problem | null>(null)

  async function handleMetaNext(input: ProblemInput) {
    const created = await onSubmit(input)

    setProblem(created)
    setStep('note')

    return created
  }

  async function convertToJpeg(file: File): Promise<File> {
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: false,
      fileType: 'image/jpeg',
      initialQuality: 0.85,
    })

    return new File(
        [compressed],
        file.name.replace(/\.[^.]+$/, '.jpg'),
        { type: 'image/jpeg' }
    )
  }

  async function handleMetaNextWithAI(
      input: ProblemInput,
      file: File
  ) {
    const created = await onSubmit(input)

    try {
      const jpeg = await convertToJpeg(file)

      const result = await analyzeImage(
          jpeg,
          created.id
      )

      created.note = result.note
      setProblem(created)
      setStep('note')

      return created
    } catch (error) {
      console.error(error)
      await deleteProblem(created.id)
      throw error
    }
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
          onNextWithAI={handleMetaNextWithAI}
        />
      </ModalShell>
    )
  }

  if (!problem) return null

  return (
    <ModalShell title="ノート編集" onClose={onClose}>
      <ProblemNoteStep problem={problem} onAutoSave={handleNoteSave} onClose={onClose} />
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
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <span>{title}</span>

          <button onClick={onClose} style={closeBtn}>
            ×
          </button>
        </div>

        <div style={content}>{children}</div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.45)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 16,
  zIndex: 2000,
} as const

const panel = {
  background: c.bg,
  width: '100%',
  maxWidth: 680,
  borderRadius: 12,
  border: `1px solid ${c.border}`,
  boxShadow: '0 10px 40px rgba(0,0,0,.08)',
} as const

const header = {
  padding: '16px 20px',
  borderBottom: `1px solid ${c.border}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontWeight: 600,
} as const

const content = {
  padding: '20px',
} as const

const closeBtn = {
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '18px',
} as const
