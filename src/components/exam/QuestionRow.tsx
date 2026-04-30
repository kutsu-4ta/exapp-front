import { ANSWER_OPTIONS, RANKS } from '../../types/exam'
import type { QuestionDraft, Rank } from '../../types/exam'

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const rankColors: Record<Rank, React.CSSProperties> = {
  A: { background: '#e1f0ff', color: '#2383e2' },
  B: { background: '#e6f6eb', color: '#19a576' },
  C: { background: '#fff5e0', color: '#f2ab26' },
  D: { background: '#ffebe9', color: '#eb5757' },
  E: { background: '#f3f3f2', color: '#8a7b6e' },
}

interface QuestionRowProps {
  question: QuestionDraft
  isScoring: boolean
  isMenuOpen: boolean
  onUpdate: (patch: Partial<QuestionDraft>) => void
  onAddParent: () => void
  onRemoveParent: () => void
  onAddSub: () => void
  onToggleMenu: () => void
  onSetQuestionType: (type: 'single' | 'multi') => void
}

export function QuestionRow({
                                question: q,
                                isScoring,
                                isMenuOpen,
                                onUpdate,
                                onAddParent,
                                onRemoveParent,
                                onAddSub,
                                onToggleMenu,
                                onSetQuestionType,
                            }: QuestionRowProps) {
    const cycleRank = () => {
        const next = RANKS[(RANKS.indexOf(q.rank) + 1) % RANKS.length]
        onUpdate({ rank: next })
    }

    return (
        <div style={{
            ...questionItem,
            ...(q.isSub ? subStyle : parentStyle),
            borderLeft: q.hasChildren ? '4px solid #eee' : (q.isSub ? '4px solid #2383e2' : '1px solid #f0f0ef'),
        }}>
            {!isScoring && (
                <div style={sideControl}>
                    <button
                        style={{ ...miniBtn, opacity: q.isSub ? 0.2 : 1 }}
                        onClick={q.isSub ? undefined : onRemoveParent}
                    >
                        －
                    </button>
                    <button style={miniBtn} onClick={q.isSub ? onAddSub : onAddParent}>＋</button>
                </div>
            )}

            <div style={{ flex: 1 }}>
                {/* 配置の要：左上に大問番号、その下にコンテンツ */}
                <div style={layoutContainer}>
                    <div style={qNumberHeader}>
                        <div style={{ position: 'relative' }}>
              <span
                  style={q.isSub ? qNumberSub : qNumberParent}
                  onClick={() => !q.isSub && !isScoring && onToggleMenu()}
              >
                {q.displayId}
              </span>
                            {isMenuOpen && !q.isSub && (
                                <div style={dropdownMenu}>
                                    <div style={menuItem} onClick={() => onSetQuestionType('single')}>● 単体問題</div>
                                    <div style={menuItem} onClick={() => onSetQuestionType('multi')}>■ 設問構成</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={controlsContent}>
                        {!q.hasChildren && (
                            isScoring ? (
                                <ScoringControls q={q} onUpdate={onUpdate} onCycleRank={cycleRank} />
                            ) : (
                                <AnswerControls q={q} onUpdate={onUpdate} />
                            )
                        )}
                    </div>
                </div>

                {isScoring && !q.hasChildren && (
                    <input
                        style={noteInput}
                        placeholder="ミスの傾向、論点のメモ..."
                        value={q.note ?? ''}
                        onChange={(e) => onUpdate({ note: e.target.value })}
                    />
                )}
            </div>
        </div>
    )
}

function AnswerControls({ q, onUpdate }: { q: QuestionDraft; onUpdate: (p: Partial<QuestionDraft>) => void }) {
    return (
        <div style={answerControlGroupVertical}>
            {/* 1行目：選択肢ボタン + 疑義ボタン */}
            <div style={answerRow}>
                <div style={optionBtnGroup}>
                    {ANSWER_OPTIONS.map(opt => (
                        <button
                            key={opt}
                            style={{
                                ...optionBtn,
                                backgroundColor: q.myAnswer === opt ? '#37352f' : '#fff',
                                color: q.myAnswer === opt ? '#fff' : '#37352f',
                            }}
                            onClick={() => onUpdate({myAnswer: opt})}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onUpdate({isDoubtful: !q.isDoubtful})}
                    style={{...doubtBtn, opacity: q.isDoubtful ? 1 : 0.15, marginLeft: 'auto'}}
                >
                    💭
                </button>
            </div>

            {/* 2行目：記述用テキストエリア（自由なサイズ調整が可能） */}
            <div style={answerRow}>
                <textarea
                    style={freeAnswerTextArea}
                    placeholder="記述解答・メモを入力..."
                    rows={1}
                    value={ANSWER_OPTIONS.includes(q.myAnswer) ? '' : q.myAnswer}
                    onChange={(e) => {
                        onUpdate({myAnswer: e.target.value});
                        // 入力に合わせて高さを自動調整する処理を挟むとよりスマートです
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                />
            </div>
        </div>
    )
}

function ScoringControls({
                             q,
                             onUpdate,
                             onCycleRank,
                         }: {
    q: QuestionDraft
    onUpdate: (p: Partial<QuestionDraft>) => void
    onCycleRank: () => void
}) {
    return (
        <div style={scoringControlGroupVertical}>
            {/* 1行目：自分の答え、正解・不正解ボタン、💭 */}
            <div style={scoringRow}>
                <div style={myAnswerDisplay}>{q.myAnswer || '-'}</div>

                <div style={scoringBtnGroup}>
                    <button
                        onClick={() => onUpdate({ isCorrect: q.isCorrect === true ? null : true })}
                        style={{ ...statusBtnSmall, ...(q.isCorrect === true ? activeCorrect : {}) }}
                    >
                        ○
                    </button>
                    <button
                        onClick={() => onUpdate({ isCorrect: q.isCorrect === false ? null : false })}
                        style={{ ...statusBtnSmall, ...(q.isCorrect === false ? activeIncorrect : {}) }}
                    >
                        ×
                    </button>
                </div>

                <button
                    onClick={() => onUpdate({ isDoubtful: !q.isDoubtful })}
                    style={{ ...doubtBtn, opacity: q.isDoubtful ? 1 : 0.15, marginLeft: '4px' }}
                >
                    💭
                </button>
            </div>

            {/* 2行目：ランク、配点、かかった時間（※時間はデータ構造に合わせて表示） */}
            <div style={scoringRowSecondary}>
                <div style={labelGroup}>
                    <span style={miniLabel}>RANK</span>
                    <button onClick={onCycleRank} style={{ ...rankBadge, ...rankColors[q.rank] }}>
                        {q.rank}
                    </button>
                </div>

                <div style={labelGroup}>
                    <span style={miniLabel}>POINT</span>
                    <div style={pointGroupScoring}>
                        <input
                            type="number"
                            style={pointInput}
                            value={q.point}
                            onChange={(e) => onUpdate({ point: parseInt(e.target.value) || 0 })}
                        />
                        <span style={pointUnit}>pt</span>
                    </div>
                </div>
                <div style={{ ...labelGroup, marginLeft: 'auto' }}>
                    <span style={miniLabel}>TIME</span>
                    <span style={timeValue}>{formatMs(q.answeredTimeMs)}</span>
                </div>
            </div>
        </div>
    )
}

// ── Styles ──
const answerControlGroupVertical: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    marginLeft: '12px'
};

const answerRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%'
};
const freeAnswerTextArea: React.CSSProperties = {
    width: '100%',
    minHeight: '38px',
    maxHeight: '200px',
    padding: '8px 12px',
    border: '1px solid #eee',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: '#fdfdfd',
    outline: 'none',
    resize: 'vertical', // ユーザーが手動で縦に伸ばせるように
    fontFamily: 'inherit',
    lineHeight: '1.5',
    transition: 'border-color 0.2s',
};
const scoringControlGroupVertical: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    marginLeft: '12px'
};

const scoringRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%'
};

const scoringRowSecondary: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    width: '100%',
    padding: '4px 0',
    borderTop: '1px dashed #eee'
};

const scoringBtnGroup: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginLeft: 'auto'
};

const statusBtnSmall: React.CSSProperties = {
    width: '44px',
    height: '32px',
    border: '1px solid #eee',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 800
};

const labelGroup: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
};

const miniLabel: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 800,
    color: '#ccc',
    letterSpacing: '0.05em'
};

const pointGroupScoring: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1px'
};

const timeValue: React.CSSProperties = {
    fontSize: '12px',
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#666'
};
const layoutContainer: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
};

const qNumberHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    marginBottom: '-4px'
};

const controlsContent: React.CSSProperties = {
    width: '100%',
    paddingLeft: '4px'
};
const questionItem: React.CSSProperties = { display: 'flex', alignItems: 'flex-start' }
const parentStyle: React.CSSProperties = { padding: '16px 14px', borderRadius: '12px', border: '1px solid #f0f0ef', backgroundColor: '#fff', marginTop: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }
const subStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: '0 8px 8px 0', backgroundColor: '#f9f9f9', marginTop: '2px', marginLeft: '12px', borderBottom: '1px solid #eee' }
const sideControl: React.CSSProperties = { width: '28px', marginRight: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }
const miniBtn: React.CSSProperties = { width: '24px', height: '24px', borderRadius: '6px', border: 'none', backgroundColor: '#f0f0f0', color: '#888', cursor: 'pointer' }
const rowTop: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' }
const qNumberParent: React.CSSProperties = { minWidth: '60px', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }
const qNumberSub: React.CSSProperties = { minWidth: '60px', fontWeight: 700, fontSize: '12px', color: '#666' }
const dropdownMenu: React.CSSProperties = { position: 'absolute', top: '100%', left: 0, zIndex: 1100, backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px solid #eee', minWidth: '120px' }
const menuItem: React.CSSProperties = { padding: '8px 12px', fontSize: '11px', cursor: 'pointer' }
const optionBtnGroup: React.CSSProperties = { display: 'flex', gap: '2px' }
const optionBtn: React.CSSProperties = { width: '28px', height: '28px', border: '1px solid #eee', borderRadius: '4px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', backgroundColor: '#fff' }
const myAnswerDisplay: React.CSSProperties = { fontSize: '13px', fontWeight: 800, color: '#37352f', backgroundColor: '#f4f4f3', padding: '4px 8px', borderRadius: '4px', minWidth: '30px', textAlign: 'center' }
const rankBadge: React.CSSProperties = { width: '24px', height: '24px', borderRadius: '5px', border: 'none', fontSize: '10px', fontWeight: 900, cursor: 'pointer' }
const activeCorrect: React.CSSProperties = { backgroundColor: '#2383e2', color: '#fff', borderColor: '#2383e2' }
const activeIncorrect: React.CSSProperties = { backgroundColor: '#eb5757', color: '#fff', borderColor: '#eb5757' }
const doubtBtn: React.CSSProperties = { fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }
const pointInput: React.CSSProperties = { width: '22px', border: 'none', fontSize: '14px', fontWeight: 900, textAlign: 'right', background: 'transparent' }
const pointUnit: React.CSSProperties = { fontSize: '9px', color: '#aaa' }
const noteInput: React.CSSProperties = { width: '100%', marginTop: '8px', padding: '8px 10px', fontSize: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#f4f4f3', boxSizing: 'border-box' }
