import { useState, useMemo } from 'react'
import AnalysisView from '../components/exam/AnalysisView'
import { SUBJECTS } from '../types/workspace'


// --- 追加された型定義 ---
type ViewMode = 'input' | 'analysis';

const RANKS = ['A', 'B', 'C', 'D', 'E'] as const;
type Rank = typeof RANKS[number];

interface QuestionResult {
    id: string;
    parentId: number;
    displayId: string;
    rank: Rank;
    isCorrect: boolean | null;
    isDoubtful: boolean;
    point: number;
    note: string;
    isSub: boolean;
    hasChildren: boolean;
}

export default function ExamPage() {
    // --- 表示切り替え用のステート追加 ---
    const [viewMode, setViewMode] = useState<ViewMode>('input');

    const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0]);
    const [examYear, setExamYear] = useState('R07');
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    const [questions, setQuestions] = useState<QuestionResult[]>(() => [
        {
            id: `q-init`,
            parentId: 1,
            displayId: `第1問`,
            rank: 'B',
            isCorrect: null,
            isDoubtful: false,
            point: 4,
            note: '',
            isSub: false,
            hasChildren: false
        }
    ]);

    // ── リアルタイム集計 (変更なし) ────────────────
    const stats = useMemo(() => {
        const targets = questions.filter(q => !q.hasChildren);
        const correctCount = targets.filter(q => q.isCorrect === true).length;
        const incorrectCount = targets.filter(q => q.isCorrect === false).length;
        const totalScore = targets.reduce((sum, q) => q.isCorrect === true ? sum + q.point : sum, 0);
        const pureScore = targets.reduce((sum, q) =>
            (q.isCorrect === true && !q.isDoubtful) ? sum + q.point : sum, 0);
        const doubtfulCount = targets.filter(q => q.isDoubtful).length;

        return { correctCount, incorrectCount, totalScore, pureScore, doubtfulCount };
    }, [questions]);

    // ── データ操作ロジック (変更なし) ────────────────
    const refreshDisplayIds = (data: QuestionResult[]) => {
        let parentCount = 0;
        return data.map((q) => {
            if (!q.isSub) {
                parentCount++;
                return { ...q, displayId: `第${parentCount}問` };
            }
            return q;
        });
    };

    const addParentQuestion = (afterParentId: number) => {
        setQuestions(prev => {
            const newParent: QuestionResult = {
                id: `q-${Date.now()}`,
                parentId: afterParentId + 0.5,
                displayId: '',
                rank: 'B',
                isCorrect: null,
                isDoubtful: false,
                point: 4,
                note: '',
                isSub: false,
                hasChildren: false
            };
            const sorted = [...prev, newParent].sort((a, b) => a.parentId - b.parentId);
            const reindexed = sorted.map((q, i) => ({ ...q, parentId: i + 1 }));
            return refreshDisplayIds(reindexed);
        });
    };

    const removeParentQuestion = (parentId: number) => {
        if (questions.filter(q => !q.isSub).length <= 1) return;
        setQuestions(prev => {
            const filtered = prev.filter(q => q.parentId !== parentId);
            const reindexed = filtered.map((q, i) => ({ ...q, parentId: i + 1 }));
            return refreshDisplayIds(reindexed);
        });
    };

    const toggleQuestionType = (parentId: number, targetType: 'single' | 'multi') => {
        setQuestions(prev => {
            const otherQuestions = prev.filter(q => q.parentId !== parentId);
            const newItems: QuestionResult[] = targetType === 'multi'
                ? [
                    { id: `p-${parentId}`, parentId, displayId: '', rank: 'B', isCorrect: null, isDoubtful: false, point: 0, note: '', isSub: false, hasChildren: true },
                    { id: `s-${parentId}-1`, parentId, displayId: `設問1`, rank: 'B', isCorrect: null, isDoubtful: false, point: 2, note: '', isSub: true, hasChildren: false }
                ]
                : [
                    { id: `p-${parentId}`, parentId, displayId: '', rank: 'B', isCorrect: null, isDoubtful: false, point: 4, note: '', isSub: false, hasChildren: false }
                ];
            return refreshDisplayIds([...otherQuestions, ...newItems].sort((a, b) => a.parentId - b.parentId || a.id.localeCompare(b.id)));
        });
        setActiveMenu(null);
    };

    const addSubQuestion = (parentId: number) => {
        setQuestions(prev => {
            const subs = prev.filter(q => q.parentId === parentId && q.isSub);
            const nextIdx = subs.length + 1;
            const newSub: QuestionResult = {
                id: `s-${parentId}-${Date.now()}`,
                parentId,
                displayId: `設問${nextIdx}`,
                rank: 'B',
                isCorrect: null,
                isDoubtful: false,
                point: 2,
                note: '',
                isSub: true,
                hasChildren: false
            };
            return [...prev, newSub].sort((a, b) => a.parentId - b.parentId || a.id.localeCompare(b.id));
        });
    };

    const updateQuestion = (id: string, patch: Partial<QuestionResult>) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
    };

    return (
        <div style={container}>
            {/* ── Tab Switcher: 最上部 ── */}
            <div style={tabContainer}>
                <button
                    style={{...tabBtn, ...(viewMode === 'input' ? activeTab : {})}}
                    onClick={() => setViewMode('input')}
                >
                    ログ入力
                </button>
                <button
                    style={{...tabBtn, ...(viewMode === 'analysis' ? activeTab : {})}}
                    onClick={() => setViewMode('analysis')}
                >
                    実績確認
                </button>
            </div>
            <div style={{ display: viewMode === 'input' ? 'block' : 'none' }}>
                <>
                    {/* ── Dashboard (既存) ── */}
                    <div style={stickyHeader}>
                        <div style={headerTopRow}>
                            <div style={metaArea}>
                                <div style={subjTxt}>{selectedSubject}</div>
                                <div style={yearTxt}>{examYear}</div>
                            </div>
                            <div style={statsBadge}>
                                <div style={statItem}><span style={dotO}>○</span> {stats.correctCount}</div>
                                <div style={statItem}><span style={dotX}>×</span> {stats.incorrectCount}</div>
                                <div style={statItem}>💭 {stats.doubtfulCount}</div>
                            </div>
                        </div>

                        <div style={scoreGrid}>
                            <div style={scoreCell}>
                                <span style={scoreLab}>TOTAL</span>
                                <span style={{...scoreVal, color: stats.totalScore >= 60 ? '#2383e2' : '#eb5757'}}>
                                    {stats.totalScore}
                                </span>
                            </div>
                            <div style={scoreVLine} />
                            <div style={scoreCell}>
                                <span style={scoreLab}>PURE</span>
                                <span style={scoreValPure}>{stats.pureScore}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Content (既存) ── */}
                    <div style={contentBody}>
                        <div style={setupRow}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    list="subject-options"
                                    style={autoCompleteInput}
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    placeholder="科目名を検索..."
                                />
                                <datalist id="subject-options">
                                    {SUBJECTS.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>
                            <input style={yearInput} value={examYear} onChange={(e) => setExamYear(e.target.value)} placeholder="年度" />
                        </div>

                        <div style={gridContainer}>
                            {questions.map((q) => (
                                <div key={q.id} style={{
                                    ...questionItem,
                                    backgroundColor: q.isSub ? 'rgba(55, 53, 47, 0.02)' : '#fff',
                                    borderLeft: q.hasChildren ? '3px solid #eee' : 'none',
                                }}>
                                    <div style={sideControl}>
                                        <button style={miniBtn} onClick={() => q.isSub ? updateQuestion(q.id, {}) : removeParentQuestion(q.parentId)}>－</button>
                                        <button style={miniBtn} onClick={() => q.isSub ? addSubQuestion(q.parentId) : addParentQuestion(q.parentId)}>＋</button>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={rowTop}>
                                            <div style={{ position: 'relative' }}>
                                                <span style={q.isSub ? qNumberSub : qNumberParent}
                                                      onClick={() => !q.isSub && setActiveMenu(activeMenu === q.parentId ? null : q.parentId)}>
                                                    {q.displayId}
                                                </span>
                                                {activeMenu === q.parentId && !q.isSub && (
                                                    <div style={dropdownMenu}>
                                                        <div style={menuItem} onClick={() => toggleQuestionType(q.parentId, 'single')}>● 単体問題</div>
                                                        <div style={menuItem} onClick={() => toggleQuestionType(q.parentId, 'multi')}>■ 設問構成</div>
                                                    </div>
                                                )}
                                            </div>

                                            {!q.hasChildren && (
                                                <>
                                                    <button onClick={() => {
                                                        const nextRank = RANKS[(RANKS.indexOf(q.rank) + 1) % RANKS.length];
                                                        updateQuestion(q.id, { rank: nextRank });
                                                    }} style={{...rankBadge, ...rankColors[q.rank]}}>{q.rank}</button>

                                                    <div style={btnGroup}>
                                                        <button onClick={() => updateQuestion(q.id, { isCorrect: q.isCorrect === true ? null : true })}
                                                                style={{...statusBtn, ...(q.isCorrect === true ? activeCorrect : {})}}>○</button>
                                                        <button onClick={() => updateQuestion(q.id, { isCorrect: q.isCorrect === false ? null : false })}
                                                                style={{...statusBtn, ...(q.isCorrect === false ? activeIncorrect : {})}}>×</button>
                                                    </div>

                                                    <button onClick={() => updateQuestion(q.id, { isDoubtful: !q.isDoubtful })}
                                                            style={{...doubtBtn, opacity: q.isDoubtful ? 1 : 0.15}}>
                                                        💭
                                                    </button>

                                                    <div style={pointGroup}>
                                                        <input type="number" style={pointInput} value={q.point}
                                                               onChange={(e) => updateQuestion(q.id, { point: parseInt(e.target.value) || 0 })} />
                                                        <span style={pointUnit}>pt</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {!q.hasChildren && (
                                            <input style={noteInput} placeholder="デバッグメモ / 弱点分析..."
                                                   value={q.note} onChange={(e) => updateQuestion(q.id, { note: e.target.value })} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <footer style={footer}><button style={saveBtn}>分析ログを保存して終了</button></footer>
                </>
            </div>

            <div style={{ display: viewMode === 'analysis' ? 'block' : 'none' }}>
                <AnalysisView />
            </div>
        </div>
    )
}

// ── Styles (整理済み & 追加) ──────────────────────────────────

// タブ用スタイル
const tabContainer: React.CSSProperties = { display: 'flex', gap: '20px', borderBottom: '1px solid #eee', marginBottom: '20px', paddingTop: '10px' };
const tabBtn: React.CSSProperties = { padding: '8px 4px', border: 'none', background: 'none', fontSize: '14px', fontWeight: 600, color: '#aaa', cursor: 'pointer', borderBottom: '2px solid transparent', transition: 'all 0.2s' };
const activeTab: React.CSSProperties = { color: '#37352f', borderBottom: '2px solid #37352f' };

const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', padding: '0 16px', color: '#37352f' };
const stickyHeader: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #eee', margin: '0 -16px 20px -16px', padding: '12px 20px' };
const headerTopRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' };
const metaArea: React.CSSProperties = { flex: 1 };
const subjTxt: React.CSSProperties = { fontSize: '12px', fontWeight: 900 };
const yearTxt: React.CSSProperties = { fontSize: '10px', color: '#888', fontWeight: 700 };
const statsBadge: React.CSSProperties = { display: 'flex', gap: '10px', backgroundColor: '#f4f4f3', padding: '4px 12px', borderRadius: '20px' };
const statItem: React.CSSProperties = { fontSize: '11px', fontWeight: 800 };
const dotO: React.CSSProperties = { color: '#2383e2' };
const dotX: React.CSSProperties = { color: '#eb5757' };
const scoreGrid: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0' };
const scoreCell: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 };
const scoreLab: React.CSSProperties = { fontSize: '9px', fontWeight: 800, color: '#aaa', marginBottom: '2px' };
const scoreVal: React.CSSProperties = { fontSize: '32px', fontWeight: 900, lineHeight: 1 };
const scoreValPure: React.CSSProperties = { fontSize: '32px', fontWeight: 900, lineHeight: 1, color: '#19a576' };
const scoreVLine: React.CSSProperties = { width: '1px', height: '30px', backgroundColor: '#eee' };
const contentBody: React.CSSProperties = { paddingTop: '10px' };
const setupRow: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '24px' };
const autoCompleteInput: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #eee', fontSize: '13px', fontWeight: 600, outline: 'none', backgroundColor: '#fff' };
const yearInput: React.CSSProperties = { width: '60px', padding: '8px', borderRadius: '8px', border: '1px solid #eee', fontSize: '13px', textAlign: 'center' };
const gridContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' };
const questionItem: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f0f0ef' };
const sideControl: React.CSSProperties = { width: '28px', marginRight: '10px', display: 'flex', flexDirection: 'column', gap: '4px' };
const miniBtn: React.CSSProperties = { width: '24px', height: '24px', borderRadius: '6px', border: 'none', backgroundColor: '#f0f0f0', color: '#888', fontSize: '12px', cursor: 'pointer' };
const rowTop: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' };
const qNumberParent: React.CSSProperties = { minWidth: '60px', fontWeight: 900, fontSize: '13px', cursor: 'pointer' };
const qNumberSub: React.CSSProperties = { minWidth: '60px', fontWeight: 700, fontSize: '12px', color: '#888', paddingLeft: '8px' };
const dropdownMenu: React.CSSProperties = { position: 'absolute', top: '100%', left: 0, zIndex: 1100, backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px solid #eee', minWidth: '120px', padding: '4px 0' };
const menuItem: React.CSSProperties = { padding: '8px 12px', fontSize: '11px', cursor: 'pointer' };
const rankBadge: React.CSSProperties = { width: '24px', height: '24px', borderRadius: '5px', border: 'none', fontSize: '10px', fontWeight: 900, cursor: 'pointer' };
const rankColors: any = { A: { background: '#e1f0ff', color: '#2383e2' }, B: { background: '#e6f6eb', color: '#19a576' }, C: { background: '#fff5e0', color: '#f2ab26' }, D: { background: '#ffebe9', color: '#eb5757' }, E: { background: '#f3f3f2', color: '#8a7b6e' } };
const btnGroup: React.CSSProperties = { display: 'flex', gap: '2px', marginLeft: 'auto' };
const statusBtn: React.CSSProperties = { width: '40px', height: '34px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '16px' };
const activeCorrect: React.CSSProperties = { backgroundColor: '#2383e2', color: '#fff', borderColor: '#2383e2' };
const activeIncorrect: React.CSSProperties = { backgroundColor: '#eb5757', color: '#fff', borderColor: '#eb5757' };
const doubtBtn: React.CSSProperties = { fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' };
const pointGroup: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: '1px', borderLeft: '1px solid #eee', paddingLeft: '8px' };
const pointInput: React.CSSProperties = { width: '22px', border: 'none', fontSize: '14px', fontWeight: 900, textAlign: 'right', outline: 'none', background: 'transparent' };
const pointUnit: React.CSSProperties = { fontSize: '9px', color: '#aaa' };
const noteInput: React.CSSProperties = { width: '100%', marginTop: '8px', padding: '8px 10px', fontSize: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#f4f4f3', outline: 'none' };
const footer: React.CSSProperties = { marginTop: '40px', textAlign: 'center', paddingBottom: '100px' };
const saveBtn: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: '#37352f', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' };