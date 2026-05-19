import type {StudySession, StudySessionInput, SubCategory} from '../../types/workspace'
import {useSettingsStore} from '../../lib/store/settings'
import {useWorkspaceDraftStore} from '../../lib/store/workspaceDraft'
import {useEffect, useId, useRef, useState} from 'react'
import {
    contentLayout,
    editableRow,
    errorStyle,
    flexRow,
    flexRowSecondary,
    inputGroup,
    materialText,
    memoText,
    notionDisabledSaveBtn,
    notionMainInp,
    notionMemoInp,
    notionNumInp,
    notionSaveBtn,
    notionSavedLabel,
    notionSubInp,
    readonlyRow,
    subjectText,
    tagStyle,
    timeBadge,
    unitText,
} from './StudyBlockRow.styles'

type SaveInput = Omit<StudySessionInput, 'dailyLogDate' | 'timeSlot'>

type Props = {
    rowKey: string
    session?: StudySession
    initialMinutes?: number
    initialSubject?: string
    initialMaterial?: string
    subCategories?: SubCategory[]
    onSave: (currentId: number | null, input: SaveInput) => Promise<number>
    onDelete: (currentId: number | null) => Promise<void>
    readonly?: boolean
}

export function StudyBlockRow({
    rowKey,
    session,
    initialMinutes,
    initialSubject,
    initialMaterial,
    subCategories = [],
    onSave,
    onDelete,
    readonly,
}: Props) {
    const uid = useId()
    const subjects = useSettingsStore((s) => s.subjects)
    const materials = useSettingsStore((s) => s.materials)
    const lastUsedMaterial = useSettingsStore((s) => s.lastUsedMaterial)
    const setLastUsedMaterial = useSettingsStore((s) => s.setLastUsedMaterial)

    const draft = useWorkspaceDraftStore((s) => s.drafts[rowKey])
    const setDraft = useWorkspaceDraftStore((s) => s.setDraft)
    const clearDraft = useWorkspaceDraftStore((s) => s.clearDraft)

    const savedIdRef = useRef<number | null>(session?.id ?? null)

    // セッションが既存ならその値をハッシュ化して「保存済み」の基準にする
    const lastSavedRef = useRef<string>(
        session
            ? JSON.stringify({
                  minutes: session.minutes,
                  subject: session.subject.trim(),
                  material: session.material.trim(),
                  subCategory: (session.subCategory ?? '').trim() || null,
                  memo: (session.memo ?? '').trim() || null,
              })
            : ''
    )

    const [minutes, setMinutes] = useState(draft?.minutes ?? String(session?.minutes ?? initialMinutes ?? ''))
    const [subject, setSubject] = useState(draft?.subject ?? session?.subject ?? initialSubject ?? '')
    const [material, setMaterial] = useState(draft?.material ?? session?.material ?? initialMaterial ?? lastUsedMaterial)
    const [subCategoryName, setSubCategoryName] = useState(draft?.subCategoryName ?? session?.subCategory ?? '')
    const [memo, setMemo] = useState(draft?.memo ?? session?.memo ?? '')

    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const closeMenu = () => setMenuOpen(false)

    const isValid =
        parseInt(minutes, 10) > 0 &&
        subject.trim().length > 0 &&
        material.trim().length > 0

    const buildPayload = (): SaveInput => ({
        minutes: parseInt(minutes, 10),
        subject: subject.trim(),
        material: material.trim(),
        subCategory: subCategoryName.trim() || null,
        memo: memo.trim() || null,
    })

    const serialize = () => JSON.stringify(buildPayload())

    // 現在の入力値が最後にAPIへ保存した値と一致するか
    const isSaved = isValid && serialize() === lastSavedRef.current

    const updateDraft = (patch: Partial<{minutes: string; subject: string; material: string; subCategoryName: string; memo: string}>) => {
        setDraft(rowKey, {minutes, subject, material, subCategoryName, memo, ...patch})
    }

    const handleConfirm = async () => {
        if (!isValid || saving || isSaved) return

        setSaving(true)
        setSaveError(null)
        try {
            const payload = buildPayload()
            const hash = serialize()
            const newId = await onSave(savedIdRef.current, payload)
            savedIdRef.current = newId
            lastSavedRef.current = hash
            setLastUsedMaterial(payload.material)
            clearDraft(rowKey)
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : '保存失敗')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        clearDraft(rowKey)
        await onDelete(savedIdRef.current)
    }

    useEffect(() => {
        function onPointerDown(e: PointerEvent) {
            if (!menuOpen) return
            if (!menuRef.current) return
            if (!menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
                e.preventDefault()
                e.stopPropagation()
            }
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        return () => document.removeEventListener('pointerdown', onPointerDown, true)
    }, [menuOpen])

    if (readonly) {
        return (
            <div style={readonlyRow}>
                <div style={timeBadge}>{minutes} min</div>
                <div style={contentLayout}>
                    <span style={subjectText}>{subject}</span>
                    {subCategoryName && <span style={tagStyle}>{subCategoryName}</span>}
                    {material && <span style={materialText}>{material}</span>}
                </div>
                {memo && <p style={memoText}>{memo}</p>}
            </div>
        )
    }

    return (
        <div style={editableRow}>
            {/* TIME + SUBJECT */}
            <div style={flexRow}>
                <div style={inputGroup}>
                    <input
                        type="number"
                        value={minutes}
                        onChange={(e) => {
                            setMinutes(e.target.value)
                            updateDraft({minutes: e.target.value})
                        }}
                        placeholder="0"
                        style={notionNumInp}
                    />
                    <span style={unitText}>min</span>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: 6, position: 'relative', flex: 1}}>
                    <input
                        list={`${uid}-subj`}
                        value={subject}
                        onChange={(e) => {
                            setSubject(e.target.value)
                            setSubCategoryName('')
                            updateDraft({subject: e.target.value, subCategoryName: ''})
                        }}
                        placeholder="科目"
                        style={notionMainInp}
                    />

                    <button type="button" onClick={() => setMenuOpen(v => !v)}>
                        ⋯
                    </button>

                    {menuOpen && (
                        <>
                            <div
                                style={overlay}
                                onPointerDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setMenuOpen(false)
                                }}
                            />
                            <div ref={menuRef} style={menu}>
                                <button
                                    style={dangerItem}
                                    onClick={() => {
                                        closeMenu()
                                        handleDelete()
                                    }}
                                >
                                    delete
                                </button>
                            </div>
                        </>
                    )}

                    <datalist id={`${uid}-subj`}>
                        {subjects.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                </div>
            </div>

            {/* 小分類 */}
            <div style={flexRowSecondary}>
                <input
                    list={`${uid}-subcat`}
                    value={subCategoryName}
                    onChange={(e) => {
                        setSubCategoryName(e.target.value)
                        updateDraft({subCategoryName: e.target.value})
                    }}
                    placeholder="小分類"
                    style={notionSubInp}
                />
                <datalist id={`${uid}-subcat`}>
                    {subCategories
                        .filter((sc) => sc.subject === subject)
                        .map((sc) => (
                            <option key={sc.id} value={sc.name} />
                        ))}
                </datalist>
            </div>

            {/* 教材 */}
            <div style={flexRowSecondary}>
                <input
                    list={`${uid}-mat`}
                    value={material}
                    onChange={(e) => {
                        setMaterial(e.target.value)
                        updateDraft({material: e.target.value})
                    }}
                    placeholder="教材"
                    style={notionSubInp}
                />
                <datalist id={`${uid}-mat`}>
                    {materials.map((m) => (
                        <option key={m} value={m} />
                    ))}
                </datalist>
            </div>

            {/* MEMO + SAVE BUTTON */}
            <div style={flexRow}>
                <input
                    value={memo}
                    onChange={(e) => {
                        setMemo(e.target.value)
                        updateDraft({memo: e.target.value})
                    }}
                    placeholder="備考"
                    style={notionMemoInp}
                />

                {saving ? (
                    <span style={notionSavedLabel}>...</span>
                ) : isSaved ? (
                    <span style={notionSavedLabel}>saved</span>
                ) : (
                    <button
                        style={isValid ? notionSaveBtn : notionDisabledSaveBtn}
                        onClick={handleConfirm}
                        disabled={!isValid}
                    >
                        save
                    </button>
                )}
            </div>

            {saveError && <p style={errorStyle}>{saveError}</p>}
        </div>
    )
}

const menu: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 6,
    background: 'white',
    border: '1px solid rgba(55,53,47,0.12)',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    padding: 4,
    zIndex: 50,
    minWidth: 120,
}

const dangerItem: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    fontSize: 13,
    color: '#eb5757',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
}

const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'transparent',
    zIndex: 40,
}
