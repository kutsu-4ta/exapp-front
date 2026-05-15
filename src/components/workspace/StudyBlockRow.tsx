import type {StudySession, StudySessionInput, SubCategory} from '../../types/workspace'
import {useSettingsStore} from '../../lib/store/settings'
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
    notionMainInp,
    notionMemoInp,
    notionNumInp,
    notionSubInp,
    readonlyRow,
    subjectText,
    tagStyle,
    timeBadge,
    unitText,
} from './StudyBlockRow.styles'

type SaveInput = Omit<StudySessionInput, 'dailyLogDate' | 'timeSlot'>

type Props = {
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

    const savedIdRef = useRef<number | null>(session?.id ?? null)
    const timerRef = useRef<number | null>(null)
    const lastSavedRef = useRef<string>('')

    const [minutes, setMinutes] = useState(String(session?.minutes ?? initialMinutes ?? ''))
    const [subject, setSubject] = useState(session?.subject ?? initialSubject ?? '')
    const [material, setMaterial] = useState(session?.material ?? initialMaterial ?? lastUsedMaterial)
    const [subCategoryName, setSubCategoryName] = useState(session?.subCategory ?? '')
    const [memo, setMemo] = useState(session?.memo ?? '')

    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveSuccessVisible, setSaveSuccessVisible] = useState(false)

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

    const save = async () => {
        if (!isValid) return

        const payload = buildPayload()
        const hash = serialize()

        if (hash === lastSavedRef.current) return

        try {
            const newId = await onSave(savedIdRef.current, payload)
            savedIdRef.current = newId
            lastSavedRef.current = hash
            setLastUsedMaterial(payload.material)

            setSaveError(null)

            setSaveSuccessVisible(true)

            window.setTimeout(() => {
                setSaveSuccessVisible(false)
            }, 3000)

        } catch (e) {
            setSaveError(e instanceof Error ? e.message : '保存失敗')
        }
    }

    const scheduleAutoSave = () => {
        if (!isValid) return

        if (timerRef.current) {
            window.clearTimeout(timerRef.current)
        }

        timerRef.current = window.setTimeout(() => {
            save()
        }, 600)
    }

    const handleDelete = async () => {
        const id = savedIdRef.current
        await onDelete(id)
    }

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current)
        }
    }, [])

    useEffect(() => {
        function onPointerDown(e: PointerEvent) {
            if (!menuOpen) return
            if (!menuRef.current) return

            const target = e.target as Node

            if (!menuRef.current.contains(target)) {
                setMenuOpen(false)

                e.preventDefault()
                e.stopPropagation()
            }
        }

        document.addEventListener('pointerdown', onPointerDown, true)

        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true)
        }
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
                            scheduleAutoSave()
                        }}
                        onBlur={save}
                        placeholder="0"
                        style={notionNumInp}
                    />
                    <span style={unitText}>min</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                    <input
                        list={`${uid}-subj`}
                        value={subject}
                        onChange={(e) => {
                            setSubject(e.target.value)
                            setSubCategoryName('')
                            scheduleAutoSave()
                        }}
                        onBlur={save}
                        placeholder="科目"
                        style={notionMainInp}
                    />

                    {/* 3点メニュー（科目の右） */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen(v => !v)}
                    >
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
                                    削除
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

            {/* MID */}
            <div style={flexRowSecondary}>
                <input
                    list={`${uid}-subcat`}
                    value={subCategoryName}
                    onChange={(e) => {
                        setSubCategoryName(e.target.value)
                    }}
                    onBlur={save}
                    placeholder="小分類"
                    style={notionSubInp}
                />

                <input
                    list={`${uid}-mat`}
                    value={material}
                    onChange={(e) => {
                        setMaterial(e.target.value)
                        scheduleAutoSave()
                    }}
                    onBlur={save}
                    placeholder="教材"
                    style={notionSubInp}
                />

                <datalist id={`${uid}-subcat`}>
                    {subCategories
                        .filter((sc) => sc.subject === subject)
                        .map((sc) => (
                            <option key={sc.id} value={sc.name} />
                        ))}
                </datalist>

                <datalist id={`${uid}-mat`}>
                    {materials.map((m) => (
                        <option key={m} value={m} />
                    ))}
                </datalist>
            </div>

            {/* MEMO */}
            <div style={flexRow}>
                <input
                    value={memo}
                    onChange={(e) => {
                        setMemo(e.target.value)
                        scheduleAutoSave()
                    }}
                    onBlur={save}
                    placeholder="備考"
                    style={notionMemoInp}
                />

                {saveSuccessVisible ?
                    <div style={saveSuccessStyle}>
                        自動保存済み
                    </div> : <span>&nbsp;</span>
                }
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

export const saveSuccessStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#19a576',
    fontWeight: 500,
}