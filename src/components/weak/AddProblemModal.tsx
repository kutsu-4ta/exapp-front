'use client'

import { type ProblemInput } from '@/types/workspace'
import { ProblemForm } from './ProblemForm'

type Props = {
    onSubmit: (input: ProblemInput) => Promise<void>
    onClose: () => void
}

export function AddProblemModal({ onSubmit, onClose }: Props) {
    return (
        <div style={overlay}>
            <div style={content}>
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
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 15, 15, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '16px',
}

const content: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
}

const header: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}

const title: React.CSSProperties = { fontWeight: 600, fontSize: '15px' }

const closeBtn: React.CSSProperties = {
    background: 'none', border: 'none', fontSize: '20px', color: 'rgba(55, 53, 47, 0.4)', cursor: 'pointer',
}

const body: React.CSSProperties = { padding: '20px' }
