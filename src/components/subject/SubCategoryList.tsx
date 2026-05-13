import type {CSSProperties} from 'react'
import {useState} from 'react'
import {subjectUi} from "@/styles/subjectUI.ts";

export function SubCategoryList({
                                    subjectName,
                                    subCategories,
                                    setSubCategories,
                                    addSubCategory,
                                    updateSubCategory,
                                    deleteSubCategory,
                                }: any) {
    const items = subCategories.filter((sc: any) => sc.subject === subjectName)

    const [value, setValue] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editingValue, setEditingValue] = useState('')

    const handleAdd = async () => {
        if (!value.trim()) return
        const created = await addSubCategory({
            subject: subjectName,
            name: value,
        })
        setSubCategories([...subCategories, created])
        setValue('')
    }

    const handleDelete = async (id: number) => {
        const target = items.find((i: any) => i.id === id)
        if (!target) return

        const ok = window.confirm(`「${target.name}」を削除しますか？\nこの小分類に紐づく全てのデータが削除されます。`)

        if (!ok) return
        await deleteSubCategory(id)
        setSubCategories(subCategories.filter((sc: any) => sc.id !== id))
        setEditingId(null)
    }

    const handleUpdate = async (id: number) => {
        // 値が空の場合は更新せずキャンセル扱いにするなどのガードも可能です
        if (!editingValue.trim()) {
            setEditingId(null)
            return
        }

        await updateSubCategory(id, {
            subject: subjectName,
            name: editingValue,
        })
        setSubCategories(subCategories.map((sc: any) =>
            sc.id === id ? { ...sc, name: editingValue } : sc
        ))
        setEditingId(null)
    }

    return (
        <div style={subjectUi.subContainer}>
            <div style={sectionHeader}>
                <span style={sectionTitle}>SUB CATEGORIES</span>
            </div>

            <div style={listBlock}>
                {items.map((sc: any, index: number) => (
                    <div key={sc.id}>
                        <div style={itemRow}>
                            {editingId === sc.id ? (
                                <>
                                    <input
                                        autoFocus
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdate(sc.id)
                                            if (e.key === 'Escape') setEditingId(null) // Escキーでもキャンセル可能に
                                        }}
                                        // フォーム外をクリックした時に強制キャンセル
                                        onBlur={() => setEditingId(null)}
                                        style={editInput}
                                    />
                                    <div style={actionGroup}>
                                        {/*
                                            注意: onBlurが先に走るとSaveボタンが消えてクリックできなくなるため、
                                            ボタン側は onMouseDown でイベントを拾うか、
                                            重要度の高い操作はあえて確定をEnterに任せるのが一般的です。
                                        */}
                                        <button
                                            style={textBtnPrimary}
                                            onMouseDown={(e) => {
                                                e.preventDefault() // onBlurより先に実行させる
                                                handleUpdate(sc.id)
                                            }}
                                        >
                                            Save
                                        </button>
                                        <button
                                            style={{ ...textBtn, color: 'rgba(235, 87, 87, 0.8)' }}
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                handleDelete(sc.id)
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span style={itemName}>{sc.name}</span>
                                    <div style={actionGroup}>
                                        <button
                                            style={textBtn}
                                            onClick={() => {
                                                setEditingId(sc.id)
                                                setEditingValue(sc.name)
                                            }}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        {index < items.length - 1 && <div style={divider} />}
                    </div>
                ))}

                <div style={addArea}>
                    <input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="新しい小分類を追加..."
                        style={addInput}
                    />
                    <button
                        style={value.trim() ? addBtnActive : addBtnDisabled}
                        onClick={handleAdd}
                        disabled={!value.trim()}
                    >
                        追加
                    </button>
                </div>
            </div>
        </div>
    )
}
// ── Styles ──────────────────────────────────────────────────────────

const sectionHeader: CSSProperties = {
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
}

const sectionTitle: CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(55, 53, 47, 0.35)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
}

const listBlock: CSSProperties = {
    border: '1px solid rgba(55, 53, 47, 0.08)',
    borderRadius: '10px',
    backgroundColor: '#fff',
    overflow: 'hidden',
}

const itemRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    minHeight: '48px',
}

const itemName: CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#37352f',
}

const editInput: CSSProperties = {
    flex: 1,
    fontSize: '14px',
    border: 'none',
    borderBottom: '1px solid #2383e2',
    outline: 'none',
    padding: '2px 0',
    marginRight: '12px',
    color: '#37352f',
}

const actionGroup: CSSProperties = {
    display: 'flex',
    gap: '12px',
}

const textBtn: CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(55, 53, 47, 0.4)',
    cursor: 'pointer',
    padding: '4px',
}

const textBtnPrimary: CSSProperties = {
    ...textBtn,
    color: '#2383e2',
}

const divider: CSSProperties = {
    height: '1px',
    backgroundColor: 'rgba(55, 53, 47, 0.06)',
    margin: '0 16px',
}

const addArea: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(55, 53, 47, 0.02)',
    gap: '12px',
}

const addInput: CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    fontSize: '13px',
    outline: 'none',
    color: '#37352f',
}

const addBtnActive: CSSProperties = {
    background: '#37352f',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
}

const addBtnDisabled: CSSProperties = {
    ...addBtnActive,
    background: 'rgba(55, 53, 47, 0.1)',
    color: 'rgba(55, 53, 47, 0.3)',
    cursor: 'default',
}