type Status = 'open' | 'done'

type Props = {
    status: Status
}

const config = {
    done: {
        label: 'Done',
        color: '#19a576',
        bg: 'rgba(45,106,31,0.10)',
    },
    open: {
        label: 'Open',
        color: 'rgba(55,53,47,0.45)',
        bg: 'rgba(55,53,47,0.06)',
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