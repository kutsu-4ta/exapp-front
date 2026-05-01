import {FAILURE_TYPE_VALUES, PROFICIENCY_VALUES} from "../types/workspace";
import type {FailureType, Problem, ProblemInput, Proficiency, SubCategory} from "../types/workspace";
import { useSettingsStore } from '../lib/store/settings';
import {ProblemCard} from "../components/weak/ProblemCard";
import {addProblem, deleteProblem, fetchProblems, updateProblem} from "../lib/api/problem";
import {useCallback, useEffect, useMemo, useState} from "react";
import {FilterPill} from "../components/weak/FilterPill";
import {AddProblemModal} from "../components/weak/AddProblemModal";
import {fetchSubCategories} from "../lib/api/subcategory";
import {c, font} from "../styles/notion";

export default function WeakPage() {
    const subjects = useSettingsStore((s) => s.subjects)
    const [problems, setProblems] = useState<Problem[]>([])
    const [subCategories, setSubCategories] = useState<SubCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)

    const [filterSubject, setFilterSubject] = useState<string>('all')
    const [filterProficiency, setFilterProficiency] = useState<Proficiency | 'all'>('all')
    const [filterFailureType, setFilterFailureType] = useState<FailureType | 'all'>('all')

    useEffect(() => {
        Promise.all([fetchProblems(), fetchSubCategories()])
            .then(([p, sc]) => { setProblems(p); setSubCategories(sc) })
            .catch((e) => setError(e instanceof Error ? e.message : '読み込みエラー'))
            .finally(() => setLoading(false))
    }, [])

    const handleAdd = useCallback(async (input: ProblemInput) => {
        const p = await addProblem(input)
        setProblems((prev) => [p, ...prev])
        setShowAddForm(false)
    }, [])

    const handleUpdate = useCallback(async (id: number, input: ProblemInput) => {
        const updated = await updateProblem(id, input)
        setProblems((prev) => prev.map((p) => (p.id === id ? updated : p)))
    }, [])

    const handleDelete = useCallback(async (id: number) => {
        if (!confirm('この項目を削除しますか？')) return
        await deleteProblem(id)
        setProblems((prev) => prev.filter((p) => p.id !== id))
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
                    <h1 style={title}>弱点管理</h1>
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

                {loading && <p style={mutedText}>Loading data...</p>}
                {error && <p style={errorText}>{error}</p>}
                {!loading && grouped.length === 0 && <div style={emptyState}><p style={mutedText}>該当する問題は見つかりませんでした</p></div>}

                {grouped.map(({ subject, items }) => (
                    <section key={subject} style={section}>
                        <div style={sectionHeader}>
                            <span style={sectionLabel}>{subject}</span>
                            <span style={badge}>{items.length}</span>
                        </div>
                        <div style={cardGrid}>
                            {items.map((p) => (
                                <ProblemCard key={p.id} problem={p} subCategories={subCategories} onUpdate={handleUpdate} onDelete={handleDelete} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {!showAddForm && (
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${c.border}`, padding: '12px 16px',
}
const headerContent: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    maxWidth: '720px', margin: '0 auto 12px',
}
const title: React.CSSProperties = { fontSize: font.md, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }
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
const mainContent: React.CSSProperties = { maxWidth: '720px', margin: '0 auto', padding: '24px 16px 120px' }
const section: React.CSSProperties = { marginBottom: '32px' }
const sectionHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }
const sectionLabel: React.CSSProperties = {
    fontSize: font.sm, fontWeight: 700, color: c.textFaint,
    letterSpacing: '0.06em', textTransform: 'uppercase',
}
const badge: React.CSSProperties = {
    fontSize: font.xs, backgroundColor: 'rgba(55, 53, 47, 0.06)',
    color: c.textSub, padding: '1px 6px', borderRadius: '10px', fontWeight: 600,
}
const cardGrid: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' }
const fab: React.CSSProperties = {
    position: 'fixed', bottom: '80px', right: '20px',
    width: '48px', height: '48px', borderRadius: '24px',
    backgroundColor: c.blue, color: c.bg, border: 'none',
    boxShadow: '0 4px 12px rgba(35, 131, 226, 0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 1000,
}
const mutedText: React.CSSProperties = { color: c.textSub, textAlign: 'center', marginTop: '60px', fontSize: font.base }
const errorText: React.CSSProperties = { color: c.red, textAlign: 'center', padding: '2rem', fontSize: font.base }
const emptyState: React.CSSProperties = { padding: '60px 0' }
