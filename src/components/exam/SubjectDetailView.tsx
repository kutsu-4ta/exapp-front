'use client'

import { SUBJECTS } from '@/types/workspace'

interface SubjectDetailViewProps {
    subject: string;
    onBack: () => void;
}

// ダミーデータ: 実際は対象科目の過去ログから抽出
const MOCK_MISTAKE_NOTES = [
    { id: '1', date: '04/25', year: 'R05', qId: '第3問', rank: 'A', note: 'ドナベディアンモデルの構造・過程・結果の区別が曖昧。', isDoubtful: true },
    { id: '2', date: '04/25', year: 'R05', qId: '第12問', rank: 'B', note: '期待理論の公式（期待×道具性×誘意性）を再確認。', isDoubtful: false },
];

export default function SubjectDetailView({ subject, onBack }: SubjectDetailViewProps) {
    return (
        <div style={detailContainer}>
            {/* ヘッダー・戻るボタン */}
            <div style={detailHeader}>
                <button onClick={onBack} style={backBtn}>← 戻る</button>
                <h2 style={detailTitle}>{subject} 分析</h2>
            </div>

            {/* ランク別正解率の要約 */}
            <div style={rankSummaryCard}>
                <h3 style={sectionLabel}>ランク別正答率</h3>
                <div style={rankGrid}>
                    {['A', 'B', 'C', 'D', 'E'].map(r => (
                        <div key={r} style={rankStatItem}>
                            <span style={rankLabel}>{r}</span>
                            <span style={rankPercent}>85%</span>
                            <div style={rankBarBase}><div style={{...rankBarFill, width: '85%'}} /></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 弱点・デバッグメモ一覧 */}
            <h3 style={sectionLabel}>弱点・要復習メモ</h3>
            <div style={noteList}>
                {MOCK_MISTAKE_NOTES.map(m => (
                    <div key={m.id} style={noteCard}>
                        <div style={noteMeta}>
                            <span style={noteDate}>{m.date} - {m.year} {m.qId}</span>
                            <span style={{...rankTag, ...rankColors[m.rank as any]}}>{m.rank}</span>
                            {m.isDoubtful && <span style={doubtEmoji}>💭</span>}
                        </div>
                        <div style={noteText}>{m.note}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Styles ──────────────────────────────────
const detailContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' };
const detailHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' };
const backBtn: React.CSSProperties = { border: 'none', background: '#f4f4f3', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' };
const detailTitle: React.CSSProperties = { fontSize: '18px', fontWeight: 900 };

const sectionLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#888', marginBottom: '8px' };
const rankSummaryCard: React.CSSProperties = { backgroundColor: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #f0f0ef' };
const rankGrid: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const rankStatItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const rankLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 900, width: '12px' };
const rankPercent: React.CSSProperties = { fontSize: '11px', fontWeight: 700, width: '30px', textAlign: 'right' };
const rankBarBase: React.CSSProperties = { flex: 1, height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' };
const rankBarFill: React.CSSProperties = { height: '100%', backgroundColor: '#2383e2' };

const noteList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' };
const noteCard: React.CSSProperties = { backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #f0f0ef' };
const noteMeta: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' };
const noteDate: React.CSSProperties = { fontSize: '10px', color: '#aaa', fontWeight: 700 };
const noteText: React.CSSProperties = { fontSize: '13px', lineHeight: 1.5, fontWeight: 500 };
const doubtEmoji: React.CSSProperties = { fontSize: '12px' };
const rankTag: React.CSSProperties = { padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 };
const rankColors: any = { A: { background: '#e1f0ff', color: '#2383e2' }, B: { background: '#e6f6eb', color: '#19a576' }, C: { background: '#fff5e0', color: '#f2ab26' }, D: { background: '#ffebe9', color: '#eb5757' }, E: { background: '#f3f3f2', color: '#8a7b6e' } };