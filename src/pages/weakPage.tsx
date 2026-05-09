import { FAILURE_TYPE_VALUES, PROFICIENCY_VALUES } from "../types/workspace";
import type { Problem } from "../types/workspace";
import type { FailureType, ProblemInput, Proficiency } from "../types/workspace";
import { useSettingsStore } from '../lib/store/settings';
import { ProblemCard } from "../components/weak/ProblemCard";
import { ProblemQuickModal } from "../components/weak/ProblemQuickModal";
import { addProblem, fetchProblems } from "../lib/api/problem"
import { getCached, setCached, invalidateCache } from "../lib/pageCache"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterPill } from "../components/weak/FilterPill";
import { AddProblemModal } from "../components/weak/AddProblemModal";
import { c, font, pageHeading } from "../styles/notion";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

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

const PAGE_SIZE = 5

export default function WeakPage() {
    const subjects = useSettingsStore((s) => s.subjects)
    const subCategories = useSettingsStore((s) => s.subCategories)
    const [problems, setProblems] = useState<Problem[]>([])
    const [initialLoading, setInitialLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [quickProblem, setQuickProblem] = useState<Problem | null>(null)

    const sentinelRef = useRef<HTMLDivElement>(null)

    const [filterSubject, setFilterSubject] = useState<string>('all')
    const [filterProficiency, setFilterProficiency] = useState<Proficiency | 'all'>('all')
    const [filterFailureType, setFilterFailureType] = useState<FailureType | 'all'>('all')

    // 初回ロード
    useEffect(() => {
        const cached = getCached<Problem[]>('weak-problems-initial')
        if (cached) {
            setProblems(cached)
            setHasMore(cached.length === PAGE_SIZE)
            setInitialLoading(false)
        }
        fetchProblems(PAGE_SIZE)
            .then((p) => {
                setProblems(p)
                setHasMore(p.length === PAGE_SIZE)
                setCached('weak-problems-initial', p)
            })
            .catch((e) => setError(e instanceof Error ? e.message : '読み込みエラー'))
            .finally(() => setInitialLoading(false))
    }, [])

    // 追加ロード
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return
        const last = problems[problems.length - 1]
        if (!last) return
        setLoadingMore(true)
        try {
            const more = await fetchProblems(PAGE_SIZE, last.id)
            setProblems((prev) => [...prev, ...more])
            setHasMore(more.length === PAGE_SIZE)
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingMore(false)
        }
    }, [problems, loadingMore, hasMore])

    // IntersectionObserver
    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMore() },
            { threshold: 0.1 },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [loadMore])

    const handleAdd = useCallback(async (input: ProblemInput) => {
        const p = await addProblem(input)
        setProblems((prev) => [p, ...prev])
        setShowAddForm(false)
        setQuickProblem(p)
        invalidateCache('weak-problems-initial')
    }, [])

    const handleUpdate = useCallback((updated: Problem) => {
        setProblems((prev) => prev.map((p) => p.id === updated.id ? updated : p))
        setQuickProblem(updated)
    }, [])

    const handleDelete = useCallback((id: number) => {
        setProblems((prev) => prev.filter((p) => p.id !== id))
        setQuickProblem(null)
        invalidateCache('weak-problems-initial')
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
    }, [problems, filterSubject, filterProficiency, filterFailureType, subjects])

    return (
        <div style={container}>
            <div style={stickyHeader}>
                <div style={headerContent}>
                    <h1 style={pageHeading}>弱点管理</h1>
                    <div style={controls}>
                        <select style={select} value={filterProficiency} onChange={(e) => setFilterProficiency(e.target.value as Proficiency | 'all')}>
                            <option value="all">習熟度: すべて</option>
                            {PROFICIENCY_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <select style={select} value={filterFailureType} onChange={(e) => setFilterFailureType(e.target.value as FailureType | 'all')}>
                            <option value="all">ミス: すべて</option>
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

                <div ref={sentinelRef} style={sentinel}>
                    {loadingMore && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                            <LoadingSpinner size="sm" />
                        </div>
                    )}
                    {!hasMore && problems.length > 0 && (
                        <span style={sentinelText}>すべて表示しました</span>
                    )}
                </div>
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
const controls: React.CSSProperties = { display: 'flex', gap: '8px' }
const select: React.CSSProperties = {
    padding: '4px 8px', fontSize: '12px', borderRadius: '4px',
    border: `1px solid rgba(55, 53, 47, 0.16)`, backgroundColor: 'transparent',
    color: c.textSub, outline: 'none', cursor: 'pointer',
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
const sentinel: React.CSSProperties = { padding: '16px', textAlign: 'center', minHeight: '1px' }
const sentinelText: React.CSSProperties = { fontSize: '12px', color: 'rgba(55, 53, 47, 0.4)' }
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
