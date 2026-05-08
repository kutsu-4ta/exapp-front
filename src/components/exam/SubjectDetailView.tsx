import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { fetchSubjectStats } from '../../lib/api/exam'
import type { ExamSubjectStats, Rank } from '../../types/exam'
import {DoubtIcon} from "@/lib/icon/DoubtIcon.tsx";

interface SubjectDetailViewProps {
  subject: string
  onBack: () => void
}

export default function SubjectDetailView({ subject, onBack }: SubjectDetailViewProps) {
  const [stats, setStats] = useState<ExamSubjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubjectStats(subject)
      .then(setStats)
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [subject])

  return (
    <div style={detailContainer}>
      <div style={detailHeader}>
        <button onClick={onBack} style={backBtn}>← 戻る</button>
        <h2 style={detailTitle}>{subject} 分析</h2>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><LoadingSpinner /></div>}
      {error && <p style={{ ...stateText, color: '#eb5757' }}>{error}</p>}

      {stats && (
        <>
          <div style={rankSummaryCard}>
            <h3 style={sectionLabel}>ランク別正答率</h3>
            <div style={rankGrid}>
              {stats.rankStats.map(r => (
                <div key={r.rank} style={rankStatItem}>
                  <span style={rankLabel}>{r.rank}</span>
                  <span style={rankPercent}>{Math.round(r.correctRate * 100)}%</span>
                  <div style={rankBarBase}>
                    <div style={{ ...rankBarFill, width: `${r.correctRate * 100}%` }} />
                  </div>
                  <span style={rankCount}>{r.count}問</span>
                </div>
              ))}
              {stats.rankStats.length === 0 && (
                <p style={stateText}>データがありません</p>
              )}
            </div>
          </div>

          <h3 style={sectionLabel}>弱点・要復習メモ</h3>
          <div style={noteList}>
            {stats.recentMistakes.length === 0 && (
              <p style={stateText}>メモはありません</p>
            )}
            {stats.recentMistakes.map(m => (
              <div key={m.questionId} style={noteCard}>
                <div style={noteMeta}>
                  <span style={noteDate}>
                    {m.completedAt.slice(5, 10).replace('-', '/')} - {m.examYear} {m.displayId}
                  </span>
                  <span style={{ ...rankTag, ...rankColors[m.rank] }}>{m.rank}</span>
                  {m.isDoubtful && <span><DoubtIcon/></span>}
                </div>
                <div style={noteText}>{m.note}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Styles ──
const rankColors: Record<Rank, React.CSSProperties> = {
  A: { background: '#e1f0ff', color: '#2383e2' },
  B: { background: '#e6f6eb', color: '#19a576' },
  C: { background: '#fff5e0', color: '#f2ab26' },
  D: { background: '#ffebe9', color: '#eb5757' },
  E: { background: '#f3f3f2', color: '#8a7b6e' },
}

const detailContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' }
const detailHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }
const backBtn: React.CSSProperties = { border: 'none', background: '#f4f4f3', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }
const detailTitle: React.CSSProperties = { fontSize: '18px', fontWeight: 900 }
const sectionLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#888', marginBottom: '8px' }
const rankSummaryCard: React.CSSProperties = { backgroundColor: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #f0f0ef' }
const rankGrid: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' }
const rankStatItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const rankLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 900, width: '12px' }
const rankPercent: React.CSSProperties = { fontSize: '11px', fontWeight: 700, width: '36px', textAlign: 'right' }
const rankCount: React.CSSProperties = { fontSize: '10px', color: '#aaa', width: '28px' }
const rankBarBase: React.CSSProperties = { flex: 1, height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }
const rankBarFill: React.CSSProperties = { height: '100%', backgroundColor: '#2383e2', transition: 'width 0.4s ease' }
const noteList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' }
const noteCard: React.CSSProperties = { backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #f0f0ef' }
const noteMeta: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }
const noteDate: React.CSSProperties = { fontSize: '10px', color: '#aaa', fontWeight: 700 }
const noteText: React.CSSProperties = { fontSize: '13px', lineHeight: 1.5, fontWeight: 500 }
const rankTag: React.CSSProperties = { padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }
const stateText: React.CSSProperties = { fontSize: '13px', color: '#aaa', padding: '8px 0' }
