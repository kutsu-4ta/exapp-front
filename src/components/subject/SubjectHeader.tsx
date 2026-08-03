import {useEffect, useRef, useState} from 'react'
import {backBtn, c} from "@/styles/notion.ts";
import {useSettingsStore} from "@/lib/store/settings.ts";
import {subjectPalette} from "@/styles/subjectUI.ts";
export function SubjectHeader({
                                  subjectName,
                                  renameSubject,
                                  subjects,
                                  setSubjects,
                                  navigate,
                                  onOpenSettings,
                              }: any) {
    const subjectColors = useSettingsStore((s) => s.subjectColors)
    const palette = subjectPalette(subjectName, subjectColors[subjectName])

    const [value, setValue] = useState(subjectName)

    useEffect(() => {
        setValue(subjectName)
    }, [subjectName])

    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const titleInputRef = useRef<HTMLInputElement>(null)
    const [titleLoading, setTitleLoading] = useState(false)
    const [renameError, setRenameError] = useState<string | null>(null)


    const handleRename = async () => {
        const newName = value.trim()
        if (!newName || newName === subjectName) {
            setIsEditingTitle(false)
            setValue(subjectName)
            return
        }
        setTitleLoading(true)
        setRenameError(null)
        try {
            await renameSubject(subjectName, newName)
            setSubjects(subjects.map((s:string) => (s === subjectName ? newName : s)))
            setIsEditingTitle(false)
            navigate(`/subjects/${encodeURIComponent(newName)}`, { replace: true })
        } catch (e) {
            setRenameError(e instanceof Error ? e.message : '変更に失敗しました')
            setValue(subjectName)
        } finally {
            setTitleLoading(false)
        }
    }

    return (
        <div style={headerUi.container}>
            <button style={backBtn} onClick={() => navigate(-1)}>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ marginRight: '6px' }}
                >
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
            </button>

            <div style={headerUi.titleRow}>
                <span style={{ ...headerUi.colorBar, color: palette.color }}>▌</span>
                {isEditingTitle ? (
                    <input
                        ref={titleInputRef}
                        autoFocus
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename()
                            if (e.key === 'Escape') {
                                setIsEditingTitle(false)
                                setValue(subjectName)
                            }
                        }}
                        style={headerUi.titleInput}
                        disabled={titleLoading}
                    />
                ) : (
                    <h1 style={headerUi.heading} onClick={() => setIsEditingTitle(true)} title="クリックして編集">
                        {titleLoading ? '...' : subjectName}
                    </h1>
                )}
                {onOpenSettings && (
                    <button style={headerUi.gearBtn} onClick={onOpenSettings} title="設定">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                )}
            </div>
            {renameError && <p style={headerUi.errorText}>{renameError}</p>}
        </div>
    )
}

const headerUi = {
    container: {
        marginBottom: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    } as React.CSSProperties,

    titleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    } as React.CSSProperties,

    colorBar: {
        fontSize: '28px',
        lineHeight: 1,
        flexShrink: 0,
        userSelect: 'none',
    } as React.CSSProperties,

    gearBtn: {
        flexShrink: 0,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'rgba(55,53,47,0.3)',
        padding: '4px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '2px',
    } as React.CSSProperties,

    titleInput: {
        fontSize: '32px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        width: '100%',
        border: 'none',
        borderBottom: `1px solid ${c.blue}`,
        outline: 'none',
        backgroundColor: 'transparent',
        color: c.text,
    } as React.CSSProperties,

    heading: {
        fontSize: '32px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        cursor: 'text',
    } as React.CSSProperties,

    errorText: {
        fontSize: '11px',
        color: c.red,
        marginTop: '4px'
    } as React.CSSProperties,
}