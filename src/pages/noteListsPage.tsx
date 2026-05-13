import { FAILURE_TYPE_VALUES, PROFICIENCY_VALUES } from "../types/workspace";
import type { Problem } from "../types/workspace";
import type { FailureType, ProblemInput, Proficiency } from "../types/workspace";
import { useSettingsStore } from '../lib/store/settings';
import { ProblemCard } from "../components/weak/ProblemCard";
import { ProblemQuickModal } from "../components/weak/ProblemQuickModal";
import { addProblem, fetchProblems } from "../lib/api/problem"
import { fetchFlashcards } from "../lib/api/subjects"
import { getCached, setCached, invalidateCache } from "../lib/pageCache"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterPill } from "../components/weak/FilterPill";
import { AddProblemModal } from "../components/weak/AddProblemModal";
import { c, font, pageHeading } from "../styles/notion";


function SkeletonCard() {
    return (
        <div style={skeletonCard}>
            <style>{`@keyframes weakSkeleton{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
            <div style={skRow}>
                <div style={{ ...sk, width: 72, height: 14 }} />
                <div style={{ ...sk, width: 52, height: 12 }} />
                <div style={{ ...sk, width: 44, height: 12 }} />
            </div>
            <div style={{ ...sk, width: '90%', height: 14 }} />
            <div style={{ ...sk, width: '65%', height: 14 }} />
            <div style={skRow}>
                <div style={{ ...sk, width: 56, height: 12 }} />
                <div style={{ ...sk, width: 72, height: 12 }} />
            </div>
        </div>
    )
}


export default function NoteListsPage() {
    const subjects = useSettingsStore((s) => s.subjects)
    const subCategories = useSettingsStore((s) => s.subCategories)
    const [problems, setProblems] = useState<Problem[]>([])
    const [initialLoading, setInitialLoading] = useState(true)
    const [filterLoading, setFilterLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [quickProblem, setQuickProblem] = useState<Problem | null>(null)
    const [copyState, setCopyState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [quizCount, setQuizCount] = useState(10)

    const didMountRef = useRef(false)

    const [filterSubject, setFilterSubject] = useState<string>('all')
    const [filterQuery, setFilterQuery] = useState<string>('')
    const [filterProficiency, setFilterProficiency] = useState<Proficiency | 'all'>('all')
    const [filterFailureType, setFilterFailureType] = useState<FailureType | 'all'>('all')

    // 初回ロード
    useEffect(() => {
        const cached = getCached<Problem[]>('weak-problems')
        if (cached) { setProblems(cached); setInitialLoading(false) }
        fetchProblems()
            .then((p) => { setProblems(p); setCached('weak-problems', p) })
            .catch((e) => setError(e instanceof Error ? e.message : '読み込みエラー'))
            .finally(() => setInitialLoading(false))
    }, [])

    // フィルター変化時の再フェッチ（debounce 250ms）
    useEffect(() => {
        if (!didMountRef.current) { didMountRef.current = true; return }
        const subjects = filterSubject === 'all' ? undefined : [filterSubject]
        const q = filterQuery.trim() || undefined
        setFilterLoading(true)
        const timer = setTimeout(() => {
            fetchProblems({ subjects, q })
                .then(setProblems)
                .catch(console.error)
                .finally(() => setFilterLoading(false))
        }, 250)
        return () => clearTimeout(timer)
    }, [filterSubject, filterQuery])

    const handleAdd = useCallback(async (input: ProblemInput) => {
        const p = await addProblem(input)
        setProblems((prev) => [p, ...prev])
        setShowAddForm(false)
        setQuickProblem(p)
        invalidateCache('weak-problems')
    }, [])

    const handleUpdate = useCallback((updated: Problem) => {
        setProblems((prev) => prev.map((p) => p.id === updated.id ? updated : p))
        setQuickProblem(updated)
    }, [])

    const handleCopyForGemini = useCallback(async () => {
        setCopyState('loading')
        try {
            const subject = filterSubject === 'all' ? undefined : filterSubject
            const label = filterSubject === 'all' ? '全科目' : filterSubject
            const count = quizCount

            const buildStats = (cards: Awaited<ReturnType<typeof fetchFlashcards>>) => {
                const weak = cards.filter(c => c.back.proficiency === '△' || c.back.proficiency === '×')
                const bySubject = new Map<string, { '定義': number; '解法': number; 'ケアレス': number; total: number }>()
                for (const c of weak) {
                    if (!bySubject.has(c.subject)) bySubject.set(c.subject, { '定義': 0, '解法': 0, 'ケアレス': 0, total: 0 })
                    const s = bySubject.get(c.subject)!
                    for (const ft of c.back.failureTypes) {
                        if (ft === '定義' || ft === '解法' || ft === 'ケアレス') { s[ft]++; s.total++ }
                    }
                }
                return [...bySubject.entries()].map(([subj, s]) => ({
                    subject: subj,
                    total: s.total,
                    定義: s.total > 0 ? `${((s['定義'] / s.total) * 100).toFixed(0)}%` : '0%',
                    解法: s.total > 0 ? `${((s['解法'] / s.total) * 100).toFixed(0)}%` : '0%',
                    ケアレス: s.total > 0 ? `${((s['ケアレス'] / s.total) * 100).toFixed(0)}%` : '0%',
                }))
            }

            const buildText = (cards: Awaited<ReturnType<typeof fetchFlashcards>>) => {
                const stats = buildStats(cards)
                return `以下は私の苦手問題データ（${label}）です。${count}問の4択クイズを作成してください。\n\n【生成ルール】\n- 表（Front）: 問題の核心となる概念・公式・判断軸を簡潔に記載\n- 裏（Back）: 解法のポイント、ミスしやすい理由、注意事項を具体的に記載\n- 復習ノート（note）がある場合はその内容を活かす\n- 習熟度が△・×の問題を優先して質の高いカードを作成\n- 出力形式は、必ず専用のクイズアプリ形式（JSON）で出力してください。\n\n【科目別ミス割合（習熟度△・×のみ）】\n${JSON.stringify(stats, null, 2)}\n\n【フラッシュカードデータ】\n${JSON.stringify(cards, null, 2)}`
            }

            // iOS Safariはawait後にclipboard.writeTextを呼ぶとユーザージェスチャーコンテキストが失われる。
            // ClipboardItemにPromiseを渡すことで、ジェスチャーを保持したまま非同期コピーが可能。
            if (typeof ClipboardItem !== 'undefined') {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/plain': fetchFlashcards(subject, count).then(
                            cards => new Blob([buildText(cards)], { type: 'text/plain' })
                        )
                    })
                ])
            } else {
                const cards = await fetchFlashcards(subject, count)
                await navigator.clipboard.writeText(buildText(cards))
            }
            setCopyState('done')
        } catch {
            setCopyState('error')
        } finally {
            setTimeout(() => setCopyState('idle'), 2000)
        }
    }, [filterSubject, quizCount])

    const handleDelete = useCallback((id: number) => {
        setProblems((prev) => prev.filter((p) => p.id !== id))
        setQuickProblem(null)
        invalidateCache('weak-problems')
    }, [])

    const grouped = useMemo(() => {
        const filtered = problems
            .filter((p) => filterSubject === 'all' || p.subject === filterSubject)
            .filter((p) => filterProficiency === 'all' || p.proficiency === filterProficiency)
            .filter((p) => filterFailureType === 'all' || p.failureTypes.includes(filterFailureType as FailureType))
        const subjectList = subjects.length > 0
            ? subjects
            : [...new Set(filtered.map((p) => p.subject))]
        return subjectList.map((s) => ({
            subject: s,
            items: filtered.filter((p) => p.subject === s),
        })).filter((g) => g.items.length > 0)
    }, [problems, filterSubject, filterQuery, filterProficiency, filterFailureType, subjects])

    return (
        <div style={container}>
            <div style={stickyHeader}>
                <div style={{ ...headerContent, flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                    {/* 1段目: タイトルとメインアクション */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <h1 style={{ ...pageHeading, marginBottom: 0 }}>ノート</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={quizCount}
                                onChange={(e) => {
                                    const v = Math.max(1, Math.min(50, Number(e.target.value)))
                                    setQuizCount(isNaN(v) ? 10 : v)
                                }}
                                style={countInput}
                                title="クイズの問題数（1〜50）"
                            />
                            <span style={{ fontSize: '11px', color: c.textSub, whiteSpace: 'nowrap' }}>問</span>
                        <button
                            style={copyBtn(copyState)}
                            onClick={handleCopyForGemini}
                            disabled={copyState === 'loading'}
                            title="Gemini用プロンプトをコピー"
                        >
                            {copyState === 'loading' && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                </svg>
                            )}
                            {copyState === 'done' && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                            {copyState === 'error' && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            )}
                            {copyState === 'idle' && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                            )}
                            <span style={{ fontSize: '11px' }}>
                {copyState === 'done' ? 'コピー済' : copyState === 'error' ? 'エラー' : 'Gemini'}
            </span>
                        </button>
                        </div>
                    </div>

                    {/* 2段目: フィルタコントロール */}
                    <div style={{
                        ...controls,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-start',
                        gap: '8px'
                    }}>
                        <div style={searchWrap}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(55,53,47,0.4)', flexShrink: 0 }}>
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="search"
                                placeholder="キーワード検索"
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                style={searchInput}
                            />
                            {filterLoading && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite', color: 'rgba(55,53,47,0.4)', flexShrink: 0 }}>
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                </svg>
                            )}
                        </div>
                        <select style={select} value={filterProficiency} onChange={(e) => setFilterProficiency(e.target.value as Proficiency | 'all')}>
                            <option value="all">習熟度: すべて</option>
                            {PROFICIENCY_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <select style={select} value={filterFailureType} onChange={(e) => setFilterFailureType(e.target.value as FailureType | 'all')}>
                            <option value="all">属性: すべて</option>
                            {FAILURE_TYPE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                </div>
                <div style={subjectScroll}>
                    <FilterPill active={filterSubject === 'all'} onClick={() => setFilterSubject('all')}>All</FilterPill>
                    {subjects.map((s) => (
                        <FilterPill key={s} active={filterSubject === s} onClick={() => setFilterSubject(s)}>{s}</FilterPill>
                    ))}
                </div>
            </div>

            <div style={mainContent}>
                {showAddForm && <AddProblemModal onSubmit={handleAdd} onClose={() => setShowAddForm(false)} subCategories={subCategories} />}

                {error && <p style={errorText}>{error}</p>}

                {initialLoading && !error && (
                    <div>
                        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {!initialLoading && grouped.length === 0 && (
                    <div style={emptyState}><p style={mutedText}>該当する問題は見つかりませんでした</p></div>
                )}

                {grouped.map(({ subject, items }) => (
                    <section key={subject} style={section}>
                        <div style={sectionHeader}>
                            <span style={sectionLabel}>{subject}</span>
                            <span style={badge}>{items.length}</span>
                        </div>
                        <div style={cardGrid}>
                            {items.map((p) => (
                                <ProblemCard key={p.id} problem={p} onClick={() => setQuickProblem(p)} />
                            ))}
                        </div>
                    </section>
                ))}

            </div>

            {quickProblem && (
                <ProblemQuickModal
                    problem={quickProblem}
                    subCategories={subCategories}
                    onClose={() => setQuickProblem(null)}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            )}

            {!showAddForm && !quickProblem && (
                <button style={fab} onClick={() => setShowAddForm(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            )}
        </div>
    )
}

const container: React.CSSProperties = { minHeight: '100vh', backgroundColor: c.bg, color: c.text }

const stickyHeader: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${c.border}`, padding: '12px 16px',
}
const headerContent: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    maxWidth: '720px', margin: '0 auto 12px',
}
const controls: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center' }

const countInput: React.CSSProperties = {
    width: '44px', padding: '4px 6px', fontSize: '12px', borderRadius: '4px',
    border: '1px solid rgba(55, 53, 47, 0.16)', backgroundColor: 'transparent',
    color: '#6366f1', outline: 'none', textAlign: 'center',
}

const copyBtn = (state: 'idle' | 'loading' | 'done' | 'error'): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '4px 8px', fontSize: '12px', borderRadius: '4px',
    border: `1px solid ${state === 'done' ? 'rgba(55,131,84,0.4)' : state === 'error' ? 'rgba(211,61,61,0.4)' : 'rgba(55, 53, 47, 0.16)'}`,
    backgroundColor: state === 'done' ? 'rgba(55,131,84,0.08)' : state === 'error' ? 'rgba(211,61,61,0.08)' : 'transparent',
    color: state === 'done' ? 'rgb(55,131,84)' : state === 'error' ? 'rgb(211,61,61)' : '#6366f1',
    cursor: state === 'loading' ? 'default' : 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
})
const select: React.CSSProperties = {
    padding: '4px 8px', fontSize: '12px', borderRadius: '4px',
    border: `1px solid rgba(55, 53, 47, 0.16)`, backgroundColor: 'transparent',
    color: c.textSub, outline: 'none', cursor: 'pointer',
}
const searchWrap: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    flex: 1, minWidth: 0,
    padding: '4px 8px', borderRadius: '4px',
    border: '1px solid rgba(55, 53, 47, 0.16)', backgroundColor: 'transparent',
}
const searchInput: React.CSSProperties = {
    flex: 1, minWidth: 0, border: 'none', outline: 'none',
    fontSize: '12px', backgroundColor: 'transparent', color: c.text,
}
const subjectScroll: React.CSSProperties = {
    display: 'flex', gap: '4px', overflowX: 'auto',
    maxWidth: '720px', margin: '0 auto', paddingBottom: '4px', scrollbarWidth: 'none',
}
const mainContent: React.CSSProperties = { maxWidth: '720px', margin: '0 auto', padding: '40px 20px 100px' }
const section: React.CSSProperties = { marginBottom: '32px' }
const sectionHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }
const sectionLabel: React.CSSProperties = {
    fontSize: font.sm, fontWeight: 700, color: c.textHint,
    letterSpacing: '0.06em', textTransform: 'uppercase',
}
const badge: React.CSSProperties = {
    fontSize: font.xs, backgroundColor: 'rgba(55, 53, 47, 0.06)',
    color: c.textSub, padding: '1px 6px', borderRadius: '10px', fontWeight: 600,
}
const cardGrid: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const fab: React.CSSProperties = {
    position: 'fixed', bottom: '80px', right: '20px',
    width: '48px', height: '48px', borderRadius: '24px',
    backgroundColor: c.blue, color: c.bg, border: 'none',
    boxShadow: '0 4px 12px rgba(35, 131, 226, 0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 1000,
}
const mutedText: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.4)', textAlign: 'center', marginTop: '60px', fontSize: font.base }
const errorText: React.CSSProperties = { color: c.red, textAlign: 'center', padding: '2rem', fontSize: font.base }
const emptyState: React.CSSProperties = { padding: '60px 0' }

const skeletonCard: React.CSSProperties = {
    padding: '16px', marginBottom: '12px', borderRadius: '16px',
    backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '10px',
}
const skRow: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center' }
const sk: React.CSSProperties = {
    borderRadius: '4px', backgroundColor: 'rgba(55,53,47,0.08)',
    animation: 'weakSkeleton 1.4s ease-in-out infinite',
}
