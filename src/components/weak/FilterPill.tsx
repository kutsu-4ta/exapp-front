'use client'

type Props = {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}

export function FilterPill({ active, onClick, children }: Props) {
    return (
        <button type="button" onClick={onClick} style={{
            ...pillBase,
            backgroundColor: active ? '#edeae6' : 'transparent',
            color: active ? '#37352f' : 'rgba(55, 53, 47, 0.45)',
            fontWeight: active ? 600 : 400,
        }}>
            {children}
        </button>
    )
}

const pillBase: React.CSSProperties = {
    padding: '4px 12px',
    fontSize: '13px',
    borderRadius: '4px',
    border: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'background 0.2s',
}
