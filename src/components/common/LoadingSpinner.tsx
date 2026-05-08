type Props = {
    size?: 'sm' | 'md' | 'lg'
    fullPage?: boolean
}

const SIZE: Record<NonNullable<Props['size']>, { dim: number; border: number }> = {
    sm: { dim: 18, border: 2 },
    md: { dim: 28, border: 3 },
    lg: { dim: 40, border: 3 },
}

export function LoadingSpinner({ size = 'md', fullPage = false }: Props) {
    const { dim, border } = SIZE[size]

    const spinner = (
        <div style={{
            width: dim,
            height: dim,
            borderRadius: '50%',
            border: `${border}px solid rgba(55,53,47,0.1)`,
            borderTopColor: 'rgba(55,53,47,0.35)',
            animation: 'spin 0.65s linear infinite',
            flexShrink: 0,
        }} />
    )

    if (fullPage) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
            }}>
                {spinner}
            </div>
        )
    }

    return spinner
}
