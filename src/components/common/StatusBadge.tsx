type Status = 'open' | 'done'

type Props = {
    status: Status
}

const config = {
    done: {
        label: 'Done',
        color: '#19a576',
        bg: '#e6f6eb',
    },
    open: {
        label: 'Open',
        color: '#f2ab26',
        bg: '#fff5e0',
    },
} as const

export function StatusBadge({ status }: Props) {
    const current = config[status]

    return (
        <span
            style={{
                ...badgeStyle,
                color: current.color,
                backgroundColor: current.bg,
            }}
        >
      {current.label}
    </span>
    )
}

const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    lineHeight: '1.2',
    letterSpacing: '0.01em',
} as const