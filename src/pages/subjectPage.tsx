import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSettingsStore } from '../lib/store/settings'
import {
  renameSubject, deleteSubject,
  fetchSubjectSettings, saveSubjectSettings,
  fetchSubjectMonthlyGoal, saveSubjectMonthlyGoal,
  fetchFlashcards, fetchSubjectActivity,
} from '../lib/api/subjects'
import { fetchSubjectStats } from '../lib/api/exam'
import { addSubCategory, updateSubCategory, deleteSubCategory } from '../lib/api/subcategory'
import type { SubCategory, SubjectSettings, Flashcard, SubjectActivityDay } from '../types/workspace'
import type { ExamSubjectStats } from '../types/exam'
import { RANKS } from '../types/exam'
import { backBtn, c } from '../styles/notion'
import { SubjectActivityChart } from '../components/subject/SubjectActivityChart'

const FAILURE_COLORS: Record<string, string> = {
  '定義ミス': '#2383e2',
  '解法ミス': '#eb5757',
  '計算ミス': '#f2ab26',
}
const FAILURE_TYPES = ['定義ミス', '解法ミス', '計算ミス'] as const

const RANK_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: '#27ae60', color: '#fff' },
  B: { bg: '#2383e2', color: '#fff' },
  C: { bg: '#f2ab26', color: '#fff' },
  D: { bg: '#eb5757', color: '#fff' },
  E: { bg: 'rgba(55,53,47,0.15)', color: 'rgba(55,53,47,0.6)' },
}

const PROF_COLORS: Record<string, string> = {
  '○': '#27ae60',
  '△': '#f2ab26',
  '×': '#eb5757',
}

export default function SubjectPage() {
  const { name: encodedName } = useParams<{ name: string }>()
  const subjectName = decodeURIComponent(encodedName ?? '')
  const navigate = useNavigate()

  const subjects = useSettingsStore((s) => s.subjects)
  const setSubjects = useSettingsStore((s) => s.setSubjects)
  const subCategories = useSettingsStore((s) => s.subCategories)
  const setSubCategories = useSettingsStore((s) => s.setSubCategories)

  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(subjectName)) {
      navigate('/', { replace: true })
    }
  }, [subjects, subjectName, navigate])

  // ── Today's five cards (all-time, not month-filtered) ───────────────────────
  const [todayCards, setTodayCards] = useState<Flashcard[]>([])
  const [todayCardsLoading, setTodayCardsLoading] = useState(true)

  useEffect(() => {
    fetchFlashcards(subjectName, 5)
      .then((cards) => { setTodayCards(cards); setTodayCardsLoading(false) })
      .catch(() => setTodayCardsLoading(false))
  }, [subjectName])

  // ── Month navigation ─────────────────────────────────────────────────────
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1) }
    else setViewMonth((m) => m + 1)
  }
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1

  // ── Settings (finalTarget, constant across months) ───────────────────────
  const [settings, setSettings] = useState<SubjectSettings>({ finalTarget: null })
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // ── Monthly goal (variable per month) ────────────────────────────────────
  const [monthlyGoal, setMonthlyGoal] = useState<string>('')
  const [goalLoading, setGoalLoading] = useState(false)
  const [goalSaving, setGoalSaving] = useState(false)

  // ── Static stats (not month-specific) ───────────────────────────────────
  const [examStats, setExamStats] = useState<ExamSubjectStats | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  // ── Activity chart (month-specific) ──────────────────────────────────────
  const [activityData, setActivityData] = useState<SubjectActivityDay[]>([])
  const [activityLoading, setActivityLoading] = useState(true)

  // Load persistent settings once
  useEffect(() => {
    fetchSubjectSettings(subjectName)
        .then((s) => { setSettings(s); setSettingsLoaded(true) })
        .catch(() => setSettingsLoaded(true))
  }, [subjectName])

  // Load non-month-specific data once
  useEffect(() => {
    setStatsLoading(true)
    Promise.all([
      fetchSubjectStats(subjectName).catch(() => null),
      fetchFlashcards(subjectName, 500).catch(() => []),
    ]).then(([stats, cards]) => {
      setExamStats(stats as ExamSubjectStats | null)
      setFlashcards(cards as Flashcard[])
      setStatsLoading(false)
    })
  }, [subjectName])

  // Reload month-specific data (goal + activity chart)
  useEffect(() => {
    setGoalLoading(true)
    setActivityLoading(true)

    fetchSubjectMonthlyGoal(subjectName, viewYear, viewMonth)
        .then((g) => { setMonthlyGoal(g.goal ?? ''); setGoalLoading(false) })
        .catch(() => { setMonthlyGoal(''); setGoalLoading(false) })

    fetchSubjectActivity(subjectName, viewYear, viewMonth)
        .then((d) => { setActivityData(d); setActivityLoading(false) })
        .catch(() => { setActivityData([]); setActivityLoading(false) })
  }, [subjectName, viewYear, viewMonth])

  const handleSettingsSave = async () => {
    setSettingsSaving(true)
    try {
      const saved = await saveSubjectSettings(subjectName, settings)
      setSettings(saved)
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleGoalSave = async () => {
    setGoalSaving(true)
    try {
      const saved = await saveSubjectMonthlyGoal(subjectName, viewYear, viewMonth, monthlyGoal || null)
      setMonthlyGoal(saved.goal ?? '')
    } finally {
      setGoalSaving(false)
    }
  }

  // ── Title Rename ──────────────────────────────────────────────────────────
  const [titleValue, setTitleValue] = useState(subjectName)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleLoading, setTitleLoading] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTitleValue(subjectName) }, [subjectName])

  const handleTitleRename = async () => {
    const newName = titleValue.trim()
    if (!newName || newName === subjectName) {
      setIsEditingTitle(false)
      setTitleValue(subjectName)
      return
    }
    setTitleLoading(true)
    setRenameError(null)
    try {
      await renameSubject(subjectName, newName)
      setSubjects(subjects.map((s) => (s === subjectName ? newName : s)))
      setSubCategories(subCategories.map((sc) =>
          sc.subject === subjectName ? { ...sc, subject: newName } : sc
      ))
      setIsEditingTitle(false)
      navigate(`/subjects/${encodeURIComponent(newName)}`, { replace: true })
    } catch (e) {
      setRenameError(e instanceof Error ? e.message : '変更に失敗しました')
      setTitleValue(subjectName)
    } finally {
      setTitleLoading(false)
    }
  }

  // ── SubCategory ───────────────────────────────────────────────────────────
  const items = subCategories.filter((sc) => sc.subject === subjectName)
  const [addValue, setAddValue] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deleteSubCatTarget, setDeleteSubCatTarget] = useState<SubCategory | null>(null)
  const [deleteSubCatLoading, setDeleteSubCatLoading] = useState(false)

  const handleAdd = async () => {
    const name = addValue.trim()
    if (!name) return
    setAddLoading(true)
    try {
      const created = await addSubCategory({ subject: subjectName, name })
      setSubCategories([...subCategories, created])
      setAddValue('')
    } finally { setAddLoading(false) }
  }

  const handleEditSave = async () => {
    const newName = editingValue.trim()
    const target = subCategories.find((sc) => sc.id === editingId)
    if (!target || !newName || newName === target.name) { setEditingId(null); return }
    setEditLoading(true)
    try {
      const updated = await updateSubCategory(target.id, { subject: target.subject, name: newName })
      setSubCategories(subCategories.map((sc) => (sc.id === updated.id ? updated : sc)))
      setEditingId(null)
    } finally { setEditLoading(false) }
  }

  const handleSubCatDelete = async () => {
    if (!deleteSubCatTarget) return
    setDeleteSubCatLoading(true)
    try {
      await deleteSubCategory(deleteSubCatTarget.id)
      setSubCategories(subCategories.filter((sc) => sc.id !== deleteSubCatTarget.id))
      setDeleteSubCatTarget(null)
    } finally { setDeleteSubCatLoading(false) }
  }

  // ── Delete Subject ────────────────────────────────────────────────────────
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteSubject(subjectName)
      setSubjects(subjects.filter((s) => s !== subjectName))
      setSubCategories(subCategories.filter((sc) => sc.subject !== subjectName))
      navigate('/', { replace: true })
    } finally { setDeleteLoading(false) }
  }

  // ── Derived Stats (all-time, not month-filtered) ─────────────────────────
  const profCounts = { '○': 0, '△': 0, '×': 0 }
  flashcards.forEach((f) => {
    const p = f.back.proficiency
    if (p === '○' || p === '△' || p === '×') profCounts[p as keyof typeof profCounts]++
  })
  const weakCards = flashcards.filter((f) => f.back.proficiency === '△' || f.back.proficiency === '×')
  const ftCounts: Record<string, number> = { '定義ミス': 0, '解法ミス': 0, '計算ミス': 0 }
  weakCards.forEach((f) => f.back.failureTypes.forEach((ft) => { if (ft in ftCounts) ftCounts[ft]++ }))
  const ftTotal = Object.values(ftCounts).reduce((a, b) => a + b, 0)

  return (
      <div style={pageWrapper}>
        <div style={contentWrap}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <div style={titleContainer}>
            {isEditingTitle ? (
                <input
                    ref={titleInputRef}
                    autoFocus
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={handleTitleRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleRename()
                      if (e.key === 'Escape') { setIsEditingTitle(false); setTitleValue(subjectName) }
                    }}
                    style={titleInput}
                    disabled={titleLoading}
                />
            ) : (
                <h1
                    style={heading}
                    onClick={() => setIsEditingTitle(true)}
                    title="クリックして編集"
                >
                  {titleLoading ? '...' : subjectName}
                </h1>
            )}
            {renameError && <p style={errorText}>{renameError}</p>}
          </div>

          {/* TODAY'S FIVE */}
          <div style={sectionHeadingWrap}>
            <span style={sectionHeading}>TODAY'S FIVE</span>
          </div>
          {todayCardsLoading ? (
            <p style={loadingText}>読み込み中...</p>
          ) : todayCards.length === 0 ? (
            <p style={emptyText}>弱点がありません</p>
          ) : (
            <div style={{ ...block, padding: '12px 20px' }}>
              {todayCards.map((card, i) => (
                <div key={card.id}>
                  <div style={todayCardRow}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: PROF_COLORS[card.back.proficiency] ?? c.text }}>
                      {card.back.proficiency}
                    </span>
                    <span style={todayCardRef}>{card.front.material} {card.front.questionRef}</span>
                    {card.front.subCategory && (
                      <span style={todayCardSub}>{card.front.subCategory}</span>
                    )}
                  </div>
                  {i < todayCards.length - 1 && <div style={divider} />}
                </div>
              ))}
              <button
                style={startTodayBtn}
                onClick={() => navigate(
                  `/practice/${encodeURIComponent(subjectName)}`,
                  { state: { todayCards, mode: 'today' } }
                )}
              >
                演習を開始
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: '6px' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}

          {/* 1. STRATEGY (Final Target at top) */}
          <div style={sectionHeadingWrap}>
            <span style={sectionHeading}>STRATEGY</span>
            {(goalSaving || settingsSaving) && <span style={savingBadge}>保存中...</span>}
          </div>
          <div style={block}>
            {/* Final Target: Persistent across months */}
            {!settingsLoaded ? (
                <p style={loadingText}>読み込み中...</p>
            ) : (
                <div style={strategyRow}>
                  <span style={strategyLabel}>最終目標</span>
                  <input
                      style={strategyInput}
                      value={settings.finalTarget ?? ''}
                      onChange={(e) => setSettings((s) => ({ ...s, finalTarget: e.target.value || null }))}
                      onBlur={handleSettingsSave}
                      placeholder="試験本番での目標点数や状態を入力..."
                  />
                </div>
            )}

            <div style={divider} />

            {/* Monthly Goal: Specific to the navigation date */}
            <div style={{ marginTop: '8px' }}>
              <div style={monthNav}>
                <button style={monthNavBtn} onClick={prevMonth}>‹</button>
                <span style={monthNavLabel}>
                {viewYear}年{viewMonth}月
                  {isCurrentMonth && <span style={currentMonthBadge}>今月</span>}
              </span>
                <button style={monthNavBtn} onClick={nextMonth}>›</button>
              </div>

              {goalLoading ? (
                  <p style={loadingText}>読み込み中...</p>
              ) : (
                  <div style={strategyRow}>
                    <span style={{ ...strategyLabel, color: 'rgba(55,53,47,0.4)' }}>今月の注力ポイント</span>
                    <textarea
                        style={strategyTextarea}
                        value={monthlyGoal}
                        onChange={(e) => setMonthlyGoal(e.target.value)}
                        onBlur={handleGoalSave}
                        placeholder={`${viewMonth}月の学習方針を入力...`}
                        rows={2}
                    />
                  </div>
              )}
            </div>
          </div>

          {/* Activity Chart */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ ...sectionHeadingWrap, marginBottom: '12px' }}>
              <span style={sectionHeading}>ACTIVITY</span>
              <span style={{ ...sectionHeading, marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                <span style={{ color: '#2383e2' }}>─ 学習時間</span>
                <span style={{ color: 'rgba(235,87,87,0.6)' }}>▌ 問題追加</span>
              </span>
            </div>
            {activityLoading ? (
                <p style={loadingText}>読み込み中...</p>
            ) : (
                <SubjectActivityChart data={activityData} year={viewYear} month={viewMonth} />
            )}
          </div>

          {statsLoading ? (
              <p style={loadingText}>読み込み中...</p>
          ) : (
              <>
                <p style={subSectionLabel}>過去問実績</p>
                {!examStats || examStats.sessionCount === 0 ? (
                    <p style={emptyText}>この月に過去問演習データはありません</p>
                ) : (
                    <div style={block}>
                      <div style={statRow}>
                        <StatCell label="演習回数" value={`${examStats.sessionCount}回`} />
                        <StatCell label="平均スコア" value={`${examStats.avgTotalScore.toFixed(1)}pt`} />
                        <StatCell label="純粋平均" value={`${examStats.avgPureScore.toFixed(1)}pt`} />
                      </div>
                      {examStats.rankStats.length > 0 && (
                          <>
                            <div style={divider} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 0' }}>
                              {RANKS.filter((r) => examStats.rankStats.some((rs) => rs.rank === r)).map((rank) => {
                                const rs = examStats.rankStats.find((s) => s.rank === rank)!
                                const pct = Math.round(rs.correctRate * 100)
                                return (
                                    <div key={rank} style={rankRow}>
                                      <span style={{ ...rankBadge, ...RANK_COLORS[rank] }}>{rank}</span>
                                      <div style={rankBarTrack}>
                                        <div style={{ ...rankBarFill, width: `${pct}%`, backgroundColor: RANK_COLORS[rank].bg }} />
                                      </div>
                                      <span style={rankPct}>{pct}%</span>
                                      <span style={rankCount}>{rs.count}問</span>
                                    </div>
                                )
                              })}
                            </div>
                          </>
                      )}
                      {examStats.recentMistakes.length > 0 && (
                          <>
                            <div style={divider} />
                            <p style={miniSectionLabel}>直近の誤答ログ</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {examStats.recentMistakes.slice(0, 8).map((m) => (
                                  <div key={`${m.sessionId}-${m.questionId}`} style={mistakeRow}>
                                    <span style={{ ...rankBadge, ...RANK_COLORS[m.rank], flexShrink: 0 }}>{m.rank}</span>
                                    <span style={mistakeMeta}>{m.examYear} {m.displayId}</span>
                                    {m.note && <span style={mistakeNote}>{m.note}</span>}
                                  </div>
                              ))}
                            </div>
                          </>
                      )}
                    </div>
                )}

                <p style={{ ...subSectionLabel, marginTop: '24px' }}>弱点分析</p>
                {flashcards.length === 0 ? (
                    <p style={emptyText}>この月の弱点登録はありません</p>
                ) : (
                    <div style={block}>
                      <div style={profRow}>
                        {(['○', '△', '×'] as const).map((p) => (
                            <div key={p} style={profCell}>
                              <span style={{ ...profBadge, color: PROF_COLORS[p] }}>{p}</span>
                              <span style={profCount}>{profCounts[p]}</span>
                            </div>
                        ))}
                        <div style={{ ...profCell, marginLeft: 'auto', color: 'rgba(55,53,47,0.35)', fontSize: '12px' }}>
                          計 {flashcards.length}問
                        </div>
                      </div>
                      {weakCards.length > 0 && (
                          <>
                            <div style={divider} />
                            <p style={miniSectionLabel}>エラー傾向（△/×）</p>
                            {ftTotal > 0 ? (
                                <>
                                  <div style={ftBarTrack}>
                                    {FAILURE_TYPES.map((ft) => {
                                      const w = ftTotal > 0 ? (ftCounts[ft] / ftTotal) * 100 : 0
                                      return w > 0 ? (
                                          <div key={ft} style={{ width: `${w}%`, height: '100%', backgroundColor: FAILURE_COLORS[ft] }} />
                                      ) : null
                                    })}
                                  </div>
                                  <div style={ftLabelRow}>
                                    {FAILURE_TYPES.map((ft) => {
                                      const pct = ftTotal > 0 ? Math.round((ftCounts[ft] / ftTotal) * 100) : 0
                                      return (
                                          <div key={ft} style={ftLabelCell}>
                                            <span style={{ ...ftDot, backgroundColor: FAILURE_COLORS[ft] }} />
                                            <span style={ftLabelText}>{ft}</span>
                                            <span style={ftLabelPct}>{pct}%</span>
                                          </div>
                                      )
                                    })}
                                  </div>
                                </>
                            ) : (
                                <p style={emptyText}>エラー種別の未分類</p>
                            )}
                          </>
                      )}
                    </div>
                )}
              </>
          )}

          {/* 3. SETTINGS */}
          <details style={settingsCollapse}>
            <summary style={settingsSummary}>科目の管理設定</summary>
            <div style={{ marginTop: '32px' }}>
              <div style={sectionHeadingWrap}>
                <span style={sectionHeading}>SUB-CATEGORIES</span>
              </div>
              <div style={block}>
                <div style={subCatList}>
                  {items.map((sc, idx) => (
                      <div key={sc.id}>
                        {editingId === sc.id ? (
                            <div style={editRow}>
                              <input
                                  autoFocus
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditSave()
                                    if (e.key === 'Escape') setEditingId(null)
                                  }}
                                  style={smallEditInput}
                              />
                              <button onClick={handleEditSave} disabled={editLoading} style={saveBtn}>保存</button>
                            </div>
                        ) : deleteSubCatTarget?.id === sc.id ? (
                            <div style={deleteConfirmRow}>
                              <span style={deleteConfirmText}>「{sc.name}」を削除しますか？</span>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button onClick={handleSubCatDelete} disabled={deleteSubCatLoading} style={destructiveBtn}>削除</button>
                                <button onClick={() => setDeleteSubCatTarget(null)} style={cancelBtn}>中止</button>
                              </div>
                            </div>
                        ) : (
                            <div style={itemRow}>
                              <span style={itemName}>{sc.name}</span>
                              <div style={itemActions}>
                                <button onClick={() => { setEditingId(sc.id); setEditingValue(sc.name) }} style={iconBtn}>編集</button>
                                <button onClick={() => setDeleteSubCatTarget(sc)} style={{ ...iconBtn, color: 'rgba(235, 87, 87, 0.6)' }}>削除</button>
                              </div>
                            </div>
                        )}
                        {idx !== items.length - 1 && <div style={divider} />}
                      </div>
                  ))}
                </div>
                <div style={addRow}>
                  <input
                      value={addValue}
                      onChange={(e) => setAddValue(e.target.value)}
                      placeholder="新しい論点名を追加..."
                      style={addInput}
                      disabled={addLoading}
                  />
                  <button onClick={handleAdd} disabled={addLoading || !addValue.trim()} style={addBtn}>追加</button>
                </div>
              </div>

              <div style={sectionHeadingWrap}>
                <span style={dangerSectionHeading}>DANGER ZONE</span>
              </div>
              <div style={dangerBlock}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={dangerTitle}>科目の削除</p>
                  <p style={dangerNote}>すべての学習記録が消去されます。</p>
                </div>
                {deleteConfirming ? (
                    <div style={deleteConfirmRow}>
                      <button onClick={handleDelete} disabled={deleteLoading} style={destructiveBtn}>削除を確定</button>
                      <button onClick={() => setDeleteConfirming(false)} style={cancelBtn}>戻る</button>
                    </div>
                ) : (
                    <button onClick={() => setDeleteConfirming(true)} style={dangerBtn}>科目を削除する</button>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>
  )
}

// ── Sub-components & Styles ──────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: string }) {
  return (
      <div style={statCell}>
        <span style={statLabel}>{label}</span>
        <span style={statValue}>{value}</span>
      </div>
  )
}

const pageWrapper: React.CSSProperties = {
  backgroundColor: c.bg, minHeight: '100vh', color: c.text,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
}
const contentWrap: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '48px 24px 120px' }

const titleContainer: React.CSSProperties = { marginBottom: '24px' }
const heading: React.CSSProperties = {
  fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', cursor: 'text',
}
const titleInput: React.CSSProperties = {
  fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', width: '100%', border: 'none',
  borderBottom: `1px solid ${c.blue}`, outline: 'none', backgroundColor: 'transparent', color: c.text,
}

// TODAY'S 5
const todayCardRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }
const todayCardRef: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: c.text, flex: 1 }
const todayCardSub: React.CSSProperties = { fontSize: '11px', color: 'rgba(55,53,47,0.4)', backgroundColor: 'rgba(55,53,47,0.05)', borderRadius: '4px', padding: '2px 6px', flexShrink: 0 }
const startTodayBtn: React.CSSProperties = {
  width: '100%', marginTop: '12px', padding: '12px',
  backgroundColor: c.text, color: '#fff', border: 'none', borderRadius: '8px',
  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const monthNav: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }
const monthNavBtn: React.CSSProperties = {
  background: 'none', border: `1px solid rgba(55,53,47,0.1)`, borderRadius: '4px',
  width: '24px', height: '24px', cursor: 'pointer', color: 'rgba(55,53,47,0.4)',
}
const monthNavLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: c.text, display: 'flex', alignItems: 'center', gap: '6px' }
const currentMonthBadge: React.CSSProperties = { fontSize: '10px', color: c.blue, backgroundColor: 'rgba(35,131,226,0.1)', padding: '1px 5px', borderRadius: '3px' }

const sectionHeadingWrap: React.CSSProperties = { marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }
const sectionHeading: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.35)', letterSpacing: '0.06em' }
const dangerSectionHeading: React.CSSProperties = { ...sectionHeading, color: 'rgba(235, 87, 87, 0.5)' }
const savingBadge: React.CSSProperties = { fontSize: '10px', color: 'rgba(55,53,47,0.3)', fontStyle: 'italic' }

const block: React.CSSProperties = { border: `1px solid rgba(55, 53, 47, 0.08)`, borderRadius: '10px', padding: '20px', marginBottom: '32px', backgroundColor: '#fff' }
const divider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55, 53, 47, 0.05)', margin: '8px 0' }

const strategyRow: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 0' }
const strategyLabel: React.CSSProperties = { fontSize: '10px', fontWeight: 700, color: c.blue, letterSpacing: '0.05em', textTransform: 'uppercase' }
const strategyTextarea: React.CSSProperties = { border: 'none', resize: 'none', fontSize: '14px', lineHeight: '1.6', color: c.text, outline: 'none', backgroundColor: 'transparent', width: '100%' }
const strategyInput: React.CSSProperties = { border: 'none', fontSize: '15px', color: c.text, outline: 'none', backgroundColor: 'transparent', fontWeight: 600, width: '100%' }

const loadingText: React.CSSProperties = { fontSize: '12px', color: 'rgba(55,53,47,0.3)', padding: '12px 0' }
const emptyText: React.CSSProperties = { fontSize: '13px', color: 'rgba(55, 53, 47, 0.3)', padding: '16px 0', textAlign: 'center' }

const subSectionLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.5)', marginBottom: '8px' }
const miniSectionLabel: React.CSSProperties = { fontSize: '10px', fontWeight: 700, color: 'rgba(55,53,47,0.35)', marginBottom: '8px', textTransform: 'uppercase' }

const statRow: React.CSSProperties = { display: 'flex', marginBottom: '4px' }
const statCell: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px' }
const statLabel: React.CSSProperties = { fontSize: '9px', color: 'rgba(55,53,47,0.4)', fontWeight: 700 }
const statValue: React.CSSProperties = { fontSize: '18px', fontWeight: 700, color: c.text }

const rankRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }
const rankBadge: React.CSSProperties = { width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }
const rankBarTrack: React.CSSProperties = { flex: 1, height: '4px', backgroundColor: 'rgba(55,53,47,0.05)', borderRadius: '2px' }
const rankBarFill: React.CSSProperties = { height: '100%', borderRadius: '2px' }
const rankPct: React.CSSProperties = { fontSize: '11px', fontWeight: 600, minWidth: '30px', textAlign: 'right' }
const rankCount: React.CSSProperties = { fontSize: '10px', color: 'rgba(55,53,47,0.3)', minWidth: '25px' }

const mistakeRow: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: '8px' }
const mistakeMeta: React.CSSProperties = { fontSize: '11px', color: 'rgba(55,53,47,0.4)', flexShrink: 0 }
const mistakeNote: React.CSSProperties = { fontSize: '11px', color: c.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

const profRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const profCell: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: '4px' }
const profBadge: React.CSSProperties = { fontSize: '16px', fontWeight: 700 }
const profCount: React.CSSProperties = { fontSize: '18px', fontWeight: 700 }

const ftBarTrack: React.CSSProperties = { height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex', backgroundColor: 'rgba(55,53,47,0.05)', marginBottom: '8px' }
const ftLabelRow: React.CSSProperties = { display: 'flex', gap: '10px', flexWrap: 'wrap' }
const ftLabelCell: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px' }
const ftDot: React.CSSProperties = { width: '6px', height: '6px', borderRadius: '50%' }
const ftLabelText: React.CSSProperties = { fontSize: '10px', color: 'rgba(55,53,47,0.5)' }
const ftLabelPct: React.CSSProperties = { fontSize: '10px', fontWeight: 700 }

const settingsCollapse: React.CSSProperties = { marginTop: '64px', borderTop: `1px solid rgba(55, 53, 47, 0.08)`, paddingTop: '24px' }
const settingsSummary: React.CSSProperties = { fontSize: '12px', color: 'rgba(55, 53, 47, 0.3)', cursor: 'pointer', textAlign: 'center', listStyle: 'none' }

const subCatList: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const itemRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }
const itemName: React.CSSProperties = { fontSize: '13px', fontWeight: 500 }
const itemActions: React.CSSProperties = { display: 'flex', gap: '4px' }
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', fontSize: '11px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.4)', cursor: 'pointer' }
const editRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }
const smallEditInput: React.CSSProperties = { flex: 1, border: `1px solid ${c.blue}`, borderRadius: '4px', padding: '4px 8px', fontSize: '13px', outline: 'none' }
const addRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(55,53,47,0.05)', paddingTop: '12px' }
const addInput: React.CSSProperties = { flex: 1, border: 'none', padding: '6px 0', fontSize: '13px', outline: 'none', backgroundColor: 'transparent' }

const dangerBlock: React.CSSProperties = { border: `1px solid rgba(235, 87, 87, 0.1)`, borderRadius: '10px', padding: '20px', backgroundColor: 'rgba(235, 87, 87, 0.01)' }
const dangerTitle: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: 'rgba(235, 87, 87, 0.7)' }
const dangerNote: React.CSSProperties = { fontSize: '11px', color: 'rgba(235, 87, 87, 0.4)', marginBottom: '12px' }
const deleteConfirmRow: React.CSSProperties = { display: 'flex', gap: '8px' }
const deleteConfirmText: React.CSSProperties = { fontSize: '12px', color: c.red, fontWeight: 600, marginBottom: '8px' }
const errorText: React.CSSProperties = { fontSize: '11px', color: c.red, marginTop: '4px' }

const saveBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: c.blue, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }
const addBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: 'rgba(55, 53, 47, 0.05)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: 'transparent', border: `1px solid rgba(55, 53, 47, 0.1)`, borderRadius: '4px', fontSize: '11px', color: 'rgba(55, 53, 47, 0.5)', cursor: 'pointer' }
const destructiveBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: c.red, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }
const dangerBtn: React.CSSProperties = { padding: '8px 14px', backgroundColor: 'transparent', color: 'rgba(235, 87, 87, 0.6)', border: `1px solid rgba(235, 87, 87, 0.2)`, borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }