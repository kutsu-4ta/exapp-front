type Props = {
    deleteConfirming: boolean
    deleteError: string | null
    deleteLoading: boolean
    onConfirmDelete: () => void
    onDelete: () => void
    onCancel: () => void
}

export function WorkspaceDeleteSection({
                                           deleteConfirming,
                                           deleteError,
                                           deleteLoading,
                                           onConfirmDelete,
                                           onDelete,
                                           onCancel,
                                       }: Props) {
    return (
        <div style={deleteArea}>
            {deleteConfirming ? (
                <div style={deleteConfirmBox}>
                    <p style={deleteConfirmText}>
                        このデイリーログと全ての学習記録を削除しますか？
                    </p>

                    {deleteError && <p style={deleteErrorText}>{deleteError}</p>}

                    <div style={deleteConfirmActions}>
                        <button
                            style={deleteConfirmBtn}
                            onClick={onDelete}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? "削除中..." : "削除する"}
                        </button>

                        <button
                            style={deleteCancelBtn}
                            onClick={onCancel}
                            disabled={deleteLoading}
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            ) : (
                <button style={deleteBtn} onClick={onConfirmDelete}>
                    Delete this daily log
                </button>
            )}
        </div>
    )
}

const deleteArea: React.CSSProperties = {
    marginTop: '80px',
    paddingTop: '32px',
    borderTop: '1px solid rgba(55, 53, 47, 0.04)',
    display: 'flex',
    justifyContent: 'center',
}

const deleteBtn: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '13px',
    color: 'rgba(235, 87, 87, 0.6)',
    cursor: 'pointer',
    fontWeight: 500,
}

const deleteConfirmBox: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    padding: '16px',
    backgroundColor: 'rgba(235, 87, 87, 0.04)',
    border: '1px solid rgba(235, 87, 87, 0.18)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}

const deleteConfirmText: React.CSSProperties = {
    fontSize: '13px',
    color: '#eb5757',
    fontWeight: 500,
    lineHeight: 1.5,
    margin: 0,
}

const deleteErrorText: React.CSSProperties = {
    fontSize: '12px',
    color: '#eb5757',
    margin: 0,
}

const deleteConfirmActions: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
}

const deleteConfirmBtn: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#eb5757',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
}

const deleteCancelBtn: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'rgba(55, 53, 47, 0.6)',
    border: '1px solid rgba(55, 53, 47, 0.16)',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
}

