import {Skeleton} from "@/components/common/Skeleton.tsx";
import {SUBJECT_COLOR_OPTIONS, subjectPalette} from "@/styles/subjectUI.ts";

type Props = {
    settingsLoaded: boolean
    settings: {
        finalTarget: string | null
        themeColor: string | null
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
    const autoPalette = subjectPalette(subjectName)

    const handleColorSelect = (color: string | null) => {
        const next = { ...settings, themeColor: color }
        setSettings(next)
        saveSubjectSettings(subjectName, next)
    }

    return (
        <>
            {/* 最終目標 */}
            <section>
                {!settingsLoaded ? (
                    <div style={block}>
                        <Skeleton width={56} height={10} style={{ marginBottom: 10 }} />
                        <Skeleton width="70%" height={14} />
                    </div>
                ) : (
                    <div style={block}>
                        <label style={label}>GOAL</label>

                        <textarea
                            style={textarea}
                            value={settings.finalTarget ?? ''}
                            onChange={(e) =>
                                setSettings((s: any) => ({
                                    ...s,
                                    finalTarget: e.target.value || null,
                                }))
                            }
                            onBlur={() => saveSubjectSettings(subjectName, settings)}
                            placeholder="ゴール設定"
                            rows={2}
                        />
                    </div>
                )}
            </section>

            {/* テーマカラー */}
            <section>
                {!settingsLoaded ? (
                    <div style={block}>
                        <Skeleton width={72} height={10} style={{ marginBottom: 10 }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} width={28} height={28} borderRadius={14} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={block}>
                        <label style={label}>THEME COLOR</label>
                        <div style={swatchRow}>
                            {/* 自動（ハッシュ色） */}
                            <button
                                style={{
                                    ...swatchBtn,
                                    backgroundColor: autoPalette.color,
                                    outline: !settings.themeColor ? `2px solid ${autoPalette.color}` : 'none',
                                    outlineOffset: '2px',
                                }}
                                onClick={() => handleColorSelect(null)}
                                title="自動"
                            >
                                {!settings.themeColor && <span style={swatchCheck}>✓</span>}
                            </button>

                            <div style={swatchDivider} />

                            {SUBJECT_COLOR_OPTIONS.map((hex) => (
                                <button
                                    key={hex}
                                    style={{
                                        ...swatchBtn,
                                        backgroundColor: hex,
                                        outline: settings.themeColor === hex ? `2px solid ${hex}` : 'none',
                                        outlineOffset: '2px',
                                    }}
                                    onClick={() => handleColorSelect(hex)}
                                    title={hex}
                                >
                                    {settings.themeColor === hex && <span style={swatchCheck}>✓</span>}
                                </button>
                            ))}
                        </div>
                        <p style={swatchHint}>
                            {settings.themeColor ? `カスタム: ${settings.themeColor}` : '自動（科目名から自動生成）'}
                        </p>
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

const textarea: React.CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    fontWeight: 600,
    background: 'transparent',
    resize: 'none',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
}

const swatchRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
}

const swatchBtn: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
}

const swatchCheck: React.CSSProperties = {
    color: '#fff',
    fontSize: '13px',
    fontWeight: 700,
    lineHeight: 1,
}

const swatchDivider: React.CSSProperties = {
    width: '1px',
    height: '24px',
    backgroundColor: 'rgba(55,53,47,0.1)',
}

const swatchHint: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(55,53,47,0.3)',
    margin: '8px 0 0',
}
