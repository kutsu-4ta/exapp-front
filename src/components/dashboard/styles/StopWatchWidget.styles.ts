export const container: React.CSSProperties = {
    padding: '0 16px',
    marginBottom: '32px',
}

export const widgetCard: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid rgba(55, 53, 47, 0.09)',
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
}

export const displaySection: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
}

export const label: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: 'rgba(55, 53, 47, 0.3)',
    letterSpacing: '0.1em',
}

export const timeWrapper: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    fontFamily: 'ia-writer-mono, "SF Mono", Menlo, monospace',
}

export const mainTime: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 500,
    color: '#37352f',
    fontVariantNumeric: 'tabular-nums',
}

export const subTime: React.CSSProperties = {
    fontSize: '18px',
    color: 'rgba(55, 53, 47, 0.2)',
    fontVariantNumeric: 'tabular-nums',
}

export const timeLink: React.CSSProperties = {
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
}

export const saveHint: React.CSSProperties = {
    fontSize: '11px',
    color: '#2383e2',
    fontWeight: 600,
    marginTop: '-2px',
}

export const errorHint: React.CSSProperties = {
    fontSize: '11px',
    color: '#eb5757',
    marginTop: '2px',
}

export const controls: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
}

export const toggleBtn = (active: boolean, syncing: boolean): React.CSSProperties => ({
    width: '52px',
    height: '52px',
    borderRadius: '26px',
    border: 'none',
    backgroundColor: syncing
        ? 'rgba(55, 53, 47, 0.04)'
        : active ? 'rgba(55, 53, 47, 0.05)' : '#37352f',
    color: active || syncing ? 'rgba(55, 53, 47, 0.4)' : '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: syncing ? 'default' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: syncing ? 0.7 : 1,
})

export const iconBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'rgba(55, 53, 47, 0.3)',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background 0.2s',
}
