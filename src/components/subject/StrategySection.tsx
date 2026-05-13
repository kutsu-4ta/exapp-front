type Props = {
    settingsLoaded: boolean
    settings: {
        finalTarget: string | null
    }
    setSettings: (v: any) => void
    saveSubjectSettings: (subjectName: string, settings: any) => void
    subjectName: string
}

export function StrategySection({
                                    settingsLoaded,
                                    settings,
                                    setSettings,
                                    saveSubjectSettings,
                                    subjectName,
                                }: Props) {
    return (
        <>
            {/* 最終目標 */}
            <section>
                {!settingsLoaded ? (
                    <div style={muted}>読み込み中...</div>
                ) : (
                    <div style={block}>
                        <label style={label}>最終目標</label>

                        <input
                            style={input}
                            value={settings.finalTarget ?? ''}
                            onChange={(e) =>
                                setSettings((s: any) => ({
                                    ...s,
                                    finalTarget: e.target.value || null,
                                }))
                            }
                            onBlur={() => saveSubjectSettings(subjectName, settings)}
                            placeholder="ゴール設定"
                        />
                    </div>
                )}
            </section>
        </>
    )
}

/* styles */
const block: React.CSSProperties = {
    border: "1px solid rgba(55,53,47,0.08)",
    borderRadius: "10px",
    padding: "16px",
    background: "#fff",
    marginBottom: "12px",
}

const label: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    color: "rgba(55,53,47,0.4)",
    marginBottom: "8px",
    display: "block",
}

const input: React.CSSProperties = {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "14px",
    fontWeight: 600,
    background: "transparent",
}

const muted: React.CSSProperties = {
    fontSize: "12px",
    color: "rgba(55,53,47,0.4)",
}
