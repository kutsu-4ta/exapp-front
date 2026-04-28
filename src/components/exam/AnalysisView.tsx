'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SUBJECTS } from '@/types/workspace'
import SubjectDetailView from "@/components/exam/SubjectDetailView";

// ダミーデータ: 実際はDBやLocalStorageから取得
const MOCK_HISTORY = [
    { date: '04/20', subject: '企業経営理論', total: 52, pure: 40 },
    { date: '04/22', subject: '財務・会計', total: 48, pure: 36 },
    { date: '04/24', subject: '運営管理', total: 58, pure: 44 },
    { date: '04/25', subject: '企業経営理論', total: 64, pure: 52 },
    { date: '04/27', subject: '財務・会計', total: 62, pure: 58 },
    { date: '04/28', subject: '運営管理', total: 68, pure: 60 },
]

export default function AnalysisView() {
    // 1. すべてのHooksをトップレベルで必ず実行されるように配置
    const [filterSubject, setFilterSubject] = useState('すべて');
    const [selectedSubjDetail, setSelectedSubjDetail] = useState<string | null>(null);

    const chartData = useMemo(() => {
        return filterSubject === 'すべて'
            ? MOCK_HISTORY
            : MOCK_HISTORY.filter(h => h.subject === filterSubject);
    }, [filterSubject]);

    // 2. 表示するJSXを変数に格納する（早期リターンを避ける）
    let mainContent;

    if (selectedSubjDetail) {
        // 詳細表示モード
        mainContent = (
            <SubjectDetailView
                subject={selectedSubjDetail}
                onBack={() => setSelectedSubjDetail(null)}
            />
        );
    } else {
        // 推移・一覧モード
        mainContent = (
            <div style={analysisContainer}>
                {/* 科目フィルタ */}
                <div style={filterRow}>
                    <select
                        style={miniSelect}
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                    >
                        <option value="すべて">すべての科目</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* トレンドグラフ */}
                <div style={chartCard}>
                    <h3 style={cardTitle}>得点推移 (TOTAL vs PURE)</h3>
                    <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <ReferenceLine y={60} stroke="#2383e2" strokeDasharray="5 5" label={{ value: '60', position: 'right', fontSize: 10, fill: '#2383e2' }} />
                                <Line type="monotone" dataKey="total" stroke="#2383e2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="TOTAL" />
                                <Line type="monotone" dataKey="pure" stroke="#19a576" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="PURE" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 科目別詳細リスト */}
                <div style={detailGrid}>
                    {SUBJECTS.map(subj => (
                        <div key={subj} style={subjCard}
                             onClick={() => setSelectedSubjDetail(subj)} // タップで詳細へ
                        >
                            <div style={subjCardHeader}>
                                <span style={subjNameSmall}>{subj}</span>
                                <span style={subjStatusTag}>安定</span>
                            </div>
                            <div style={subjCardBody}>
                                <div style={dataItem}>
                                    <span style={dataLabel}>Avg. PURE</span>
                                    <span style={dataValue}>54.2</span>
                                </div>
                                <div style={dataItem}>
                                    <span style={dataLabel}>回数</span>
                                    <span style={dataValue}>12回</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 3. 最後に単一のreturnで描画
    return (
        <div style={{ width: '100%' }}>
            {mainContent}
        </div>
    );
}

// ── Styles ──────────────────────────────────

const analysisContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' };
const filterRow: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end' };
const miniSelect: React.CSSProperties = { padding: '6px 12px', borderRadius: '8px', border: '1px solid #eee', fontSize: '12px', fontWeight: 600, backgroundColor: '#fff', color: '#37352f' };
const chartCard: React.CSSProperties = { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #f0f0ef', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const cardTitle: React.CSSProperties = { fontSize: '13px', fontWeight: 800, marginBottom: '20px', color: '#888', letterSpacing: '0.05em' };
const tooltipStyle = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' };
const detailGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const subjCard: React.CSSProperties = { backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #f0f0ef', cursor: 'pointer' };
const subjCardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' };
const subjNameSmall: React.CSSProperties = { fontSize: '11px', fontWeight: 900 };
const subjStatusTag: React.CSSProperties = { fontSize: '9px', fontWeight: 800, padding: '2px 6px', backgroundColor: '#e6f6eb', color: '#19a576', borderRadius: '4px' };
const subjCardBody: React.CSSProperties = { display: 'flex', justifyContent: 'space-between' };
const dataItem: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const dataLabel: React.CSSProperties = { fontSize: '8px', color: '#aaa', fontWeight: 700 };
const dataValue: React.CSSProperties = { fontSize: '14px', fontWeight: 900, color: '#37352f' };