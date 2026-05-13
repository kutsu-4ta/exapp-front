import {useState} from 'react'
import type {SubCategory} from '../../types/workspace'
import type {FlashBugfixConfig} from '../../lib/api/morningQuiz'
import {c, font} from '../../styles/notion'

const FAILURE_TYPES = ['定義', '解法', 'ケアレス'] as const
const PROFICIENCY_OPTIONS = ['○', '△', '×'] as const

interface Props {
    subjectName: string
    subCategories: SubCategory[]
    onClose: () => void
    onStart: (config: FlashBugfixConfig) => void
}

export function FlashBugfixConfigModal({subjectName, subCategories,onClose, onStart}: Props) {
    const [failureTypes, setFailureTypes] = useState<string[]>(FAILURE_TYPES.map(ft => ft))
    const [subCategoryIds, setSubCategoryIds] = useState<number[]>(subCategories.map(sc => sc.id))

    const [touchedOrder, setTouchedOrder] = useState<'recent' | 'old' | null>(null)
    const [limit, setLimit] = useState(5)
    const [proficiency, setProficiency] = useState<string[]>(['△', '×'])

    // 共通のトグルロジック
    const toggleProficiency = (p: string) =>
        setProficiency((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])

    const toggleSubCat = (id: number) =>
        setSubCategoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

    const toggleFailureType = (ft: string) =>
        setFailureTypes((prev) => prev.includes(ft) ? prev.filter((x) => x !== ft) : [...prev, ft])

    const toggleTouchedOrder = (v: 'recent' | 'old') =>
        setTouchedOrder((prev) => (prev === v ? null : v))

    return (
        <div style={overlay} onClick={onClose}>
            <div style={sheet} onClick={(e) => e.stopPropagation()}>
                <div style={contentInner}>
                    <div style={handle}/>

                    {/* Header */}
                    <div style={sheetHeader}>
                        <div>
                            <p style={modalTitle}>Flash Bugfix</p>
                            <p style={subjectLabel}>{subjectName}</p>
                        </div>
                        <button style={closeBtn} onClick={onClose} aria-label="閉じる">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>

                    <div style={body}>
                        {/* Sub-category (複数選択) */}
                        {subCategories.length > 0 && (
                            <div style={fieldGroup}>
                                <p style={fieldLabel}>論点</p>
                                <div style={chipWrap}>
                                    {subCategories.map((sc) => (
                                        <Chip
                                            key={sc.id}
                                            selected={subCategoryIds.includes(sc.id)} // includesで判定
                                            onClick={() => toggleSubCat(sc.id)}
                                        >
                                            {sc.name}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Failure type (複数選択) */}
                        <div style={fieldGroup}>
                            <p style={fieldLabel}>属性</p>
                            <div style={chipWrap}>
                                {FAILURE_TYPES.map((ft) => (
                                    <Chip
                                        key={ft}
                                        selected={failureTypes.includes(ft)} // includesで判定
                                        onClick={() => toggleFailureType(ft)}
                                    >
                                        {ft}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        {/* Proficiency */}
                        <div style={fieldGroup}>
                            <p style={fieldLabel}>習熟度</p>
                            <div style={chipWrap}>
                                {PROFICIENCY_OPTIONS.map((p) => (
                                    <Chip
                                        key={p}
                                        selected={proficiency.includes(p)}
                                        onClick={() => toggleProficiency(p)}
                                    >
                                        {p}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        {/* Touched order */}
                        <div style={fieldGroup}>
                            <p style={fieldLabel}>問題順</p>
                            <div style={chipWrap}>
                                <Chip selected={touchedOrder === 'old'} onClick={() => toggleTouchedOrder('old')}>
                                    古い順
                                </Chip>
                                <Chip selected={touchedOrder === 'recent'} onClick={() => toggleTouchedOrder('recent')}>
                                    新しい順
                                </Chip>
                            </div>
                        </div>

                        {/* Limit stepper */}
                        <div style={fieldGroup}>
                            <p style={fieldLabel}>問題数</p>
                            <div style={stepperRow}>
                                <button
                                    style={stepBtn}
                                    onClick={() => setLimit((l) => Math.max(1, l - 1))}
                                    disabled={limit <= 1}
                                >
                                    −
                                </button>
                                <span style={stepValue}>{limit}</span>
                                <button
                                    style={stepBtn}
                                    onClick={() => setLimit((l) => Math.min(10, l + 1))}
                                    disabled={limit >= 10}
                                >
                                    ＋
                                </button>
                            </div>
                        </div>

                        <button
                            style={startBtn}
                            onClick={() => onStart({
                                failureTypes, // 配列として渡す
                                subCategoryIds, // 配列として渡す
                                touchedOrder,
                                limit,
                                proficiency
                            })}
                        >
                            生成して開始する
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2.5" strokeLinecap="round" style={{marginLeft: '6px'}}>
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Chip({selected, onClick, children}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            style={{
                ...chipBase,
                backgroundColor: selected ? 'rgba(55,53,47,0.08)' : 'transparent',
                borderColor: selected ? 'rgba(55,53,47,0.25)' : 'rgba(55,53,47,0.1)',
                color: selected ? c.text : 'rgba(55,53,47,0.45)',
                fontWeight: selected ? 600 : 400,
            }}
        >
            {children}
        </button>
    )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 300,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'flex-end',
}
const sheet: React.CSSProperties = {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '20px 20px 0 0',
    maxHeight: '85vh',
    overflowY: 'auto',
    paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
}
const handle: React.CSSProperties = {
    width: '36px', height: '4px', borderRadius: '2px',
    backgroundColor: 'rgba(55,53,47,0.15)', margin: '12px auto 0',
}
const sheetHeader: React.CSSProperties = {
    position: 'relative',
    padding: '16px 48px 14px 20px',
    borderBottom: `1px solid rgba(55,53,47,0.08)`,
}
const closeBtn: React.CSSProperties = {
    position: 'absolute', top: '14px', right: '16px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(55,53,47,0.3)', padding: '4px', borderRadius: '4px',
    display: 'flex', alignItems: 'center',
}
const modalTitle: React.CSSProperties = {
    fontSize: '16px', fontWeight: 700, color: c.text, margin: 0,
}
const subjectLabel: React.CSSProperties = {
    fontSize: font.sm, color: 'rgba(55,53,47,0.4)', margin: '2px 0 0',
}
const body: React.CSSProperties = {
    padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: '20px',
}
const fieldGroup: React.CSSProperties = {display: 'flex', flexDirection: 'column', gap: '8px'}
const fieldLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: 'rgba(55,53,47,0.35)',
    letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0,
}
const chipWrap: React.CSSProperties = {display: 'flex', gap: '6px', flexWrap: 'wrap'}
const chipBase: React.CSSProperties = {
    padding: '5px 12px', borderRadius: '6px', border: '1px solid',
    fontSize: '13px', cursor: 'pointer', transition: 'all 0.1s',
}
const stepperRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px',
}
const stepBtn: React.CSSProperties = {
    width: '32px', height: '32px', borderRadius: '8px',
    border: `1px solid rgba(55,53,47,0.12)`,
    backgroundColor: 'rgba(55,53,47,0.03)', color: c.text,
    fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const stepValue: React.CSSProperties = {
    fontSize: '20px', fontWeight: 700, color: c.text,
    minWidth: '28px', textAlign: 'center',
}
const startBtn: React.CSSProperties = {
    width: '100%', padding: '14px', backgroundColor: c.text, color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: font.base, fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: '4px',
}
const contentInner: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
}