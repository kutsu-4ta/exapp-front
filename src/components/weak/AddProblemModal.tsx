'use client'

import { type ProblemInput } from '@/types/workspace'
import { ProblemForm } from './ProblemForm'
import { c } from '@/styles/notion'

type Props = { onSubmit: (input: ProblemInput) => Promise<void>; onClose: () => void }

export function AddProblemModal({ onSubmit, onClose }: Props) {
    return (
        <div style={overlay}>
            <div style={panel}>
                <div style={header}>
                    <span style={title}>新規弱点登録</span>
                    <button onClick={onClose} style={closeBtn}>×</button>
                </div>
                <div style={body}>
                    <ProblemForm onSubmit={onSubmit} onCancel={onClose} />
                </div>
            </div>
        </div>
    )
}

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
}
const header: React.CSSProperties = {
    padding: '16px 20px', borderBottom: `1px solid ${c.border}`,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}
const title: React.CSSProperties = { fontWeight: 600, fontSize: '15px' }
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', fontSize: '20px', color: c.textSub, cursor: 'pointer' }
const body: React.CSSProperties = { padding: '20px' }
