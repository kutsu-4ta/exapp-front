import {useEffect, useRef, useState} from 'react'
import {backBtn, c} from "@/styles/notion.ts";
import type {SubCategory} from "@/types/workspace.ts";
export function SubjectHeader({
                                  subjectName,
                                  renameSubject,
                                  subjects,
                                  setSubjects,
                                  subCategories,
                                  setSubCategories,
                                  navigate,
                              }: any) {
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
            setSubCategories(
                subCategories.map((sc:SubCategory) => (sc.subject === subjectName ? { ...sc, subject: newName } : sc))
            )
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

            {/*<input*/}
            <div>
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
                {renameError && <p style={headerUi.errorText}>{renameError}</p>}
            </div>
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