import {LongPressButton} from "@/components/common/LongPressButton"

type Props = {
    isCompleted: boolean
    actionLoading: boolean
    onComplete: () => void
    onUncomplete: () => void
}

export function WorkspaceBottomBar({
                                       isCompleted,
                                       actionLoading,
                                       onComplete,
                                       onUncomplete,
                                   }: Props) {
    return (
        <div style={bottomBar}>
            <div style={bottomBarContainer}>
                {isCompleted ? (
                    <button
                        style={reopenBtn}
                        onClick={onUncomplete}
                        disabled={actionLoading}
                    >
                        {actionLoading ? "Updating..." : "Reopen"}
                    </button>
                ) : (
                    <LongPressButton
                        style={completeBtn}
                        onConfirm={onComplete}
                        disabled={actionLoading}
                    >
                        {actionLoading ? "Processing..." : "Complete"}
                    </LongPressButton>
                )}
            </div>
        </div>
    )
}

const bottomBar: React.CSSProperties = {
    position: 'fixed',
    bottom: 'calc(56px + env(safe-area-inset-bottom))',
    left: 0,
    right: 0,
    padding: '16px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(55, 53, 47, 0.08)',
    zIndex: 900,
}

const bottomBarContainer: React.CSSProperties = {
    maxWidth: '720px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
}

const completeBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2383e2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(35, 131, 226, 0.2)',
}

const reopenBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: 'rgba(55, 53, 47, 0.6)',
    border: '1px solid rgba(55, 53, 47, 0.15)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
}
