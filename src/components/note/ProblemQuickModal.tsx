import {LongPressButton} from "@/components/common/LongPressButton.tsx";
import {FAILURE_COLORS, FailureTypeSelector} from "@/components/common/FailureTypeSlecter.tsx";
import {useEffect, useRef, useState} from "react";
import type {MorningQuizSession} from "../../lib/api/morningQuiz";
import type {Problem, ProblemQuiz, Proficiency} from "../../types/workspace";
import {c, font} from "../../styles/notion";
import {PROF_STYLE, subjectPalette} from "@/styles/subjectUI.ts";
import {deleteProblem, deleteProblemQuiz, fetchProblemQuizzes, updateProblem} from "../../lib/api/problem";
import {Copy, Pencil, Star, X} from "lucide-react";
import {MarkdownContent} from "@/components/common/MarkdownContent.tsx";
import {useNavigate} from "react-router-dom";
import {useSettingsStore} from "../../lib/store/settings";
import {BottomSheet, sheetBodyStyle, sheetCloseBtnStyle, sheetFlexHeaderStyle} from '@/components/common/BottomSheet'
import {NoteEditor} from './NoteEditor'
import {ProficiencySelector} from '@/components/common/ProficiencySelector'
import {
  notionDisabledSaveBtn,
  notionMainInp,
  notionSaveBtn,
  notionSubInp,
  tinyLabel
} from '@/components/workspace/StudyBlockRow.styles'
import {RelatedProblemsSection} from './RelatedProblemsSection'

type Props = {
  problem: Problem;
  onClose: () => void;
  onDelete: (id: number) => void;
  onUpdate: (problem: Problem) => void;
  onNavigate?: (problem: Problem) => void;
  hideQuizzes?: boolean;
  zIndex?: number;
};

export function ProblemQuickModal({problem, onClose, onDelete, onUpdate, onNavigate, hideQuizzes = false, zIndex}: Props) {
  const navigate = useNavigate();
  const setLastUsedMaterial = useSettingsStore((s) => s.setLastUsedMaterial);
  const subjectColors = useSettingsStore((s) => s.subjectColors);
  const subjects = useSettingsStore((s) => s.subjects);
  const materials = useSettingsStore((s) => s.materials);
  const allSubCategories = useSettingsStore((s) => s.subCategories);

  // ── 編集状態（メタ・ノートを独立管理）──
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [quizzes, setQuizzes] = useState<ProblemQuiz[]>([]);
  const [draft, setDraft] = useState<Problem>(problem);
  const [note, setNote] = useState(problem.note ?? "");
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [metaSaveError, setMetaSaveError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

  // problem が差し替わったとき（芋づる遷移）に内部stateを同期
  useEffect(() => {
    setDraft(problem);
    setNote(problem.note ?? '');
    setIsEditingMeta(false);
    setIsEditingNote(false);
  }, [problem.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // メタ編集モードに入るときだけ draft を同期
  useEffect(() => {
    if (isEditingMeta) { setDraft(problem); setMetaSaveError(null); }
  }, [isEditingMeta]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
      window.clearTimeout(timerRef.current ?? 0);
      window.clearTimeout(successTimerRef.current ?? 0);
    };
  }, []);

  useEffect(() => {
    if (hideQuizzes) return;
    fetchProblemQuizzes(problem.id).then(setQuizzes).catch(() => {});
  }, [problem.id, hideQuizzes]);

  async function handleDeleteQuiz(quizId: number) {
    await deleteProblemQuiz(problem.id, quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  }

  async function handleStartGoodQuizSession() {
    const allQuizzes = await fetchProblemQuizzes(problem.id);
    const qs = allQuizzes.filter((q) => q.quizType === 'multiple_choice');
    if (qs.length === 0) return;
    const preloadedSession: MorningQuizSession = {
      session_id: `good-quiz-${problem.id}`,
      questions: qs.map((q) => ({
        id: String(problem.id), subject: problem.subject, sub_category: problem.subCategory ?? "",
        problem_context: {original_ref: problem.questionRef, user_memo: problem.note ?? "", material_name: null},
        quiz: {question: q.question, options: q.options, correct_index: q.correctIndex ?? 0, explanation: q.explanation},
      })),
    };
    onClose();
    navigate(`/subjects/${encodeURIComponent(problem.subject)}/flash-bugfix`, {state: {preloadedSession}});
  }

  // ノート自動保存
  function scheduleSave(nextNote: string) {
    setSaveSuccessVisible(false);
    setIsSaving(true);
    window.clearTimeout(timerRef.current ?? 0);
    timerRef.current = window.setTimeout(async () => {
      try {
        const updated = await updateProblem(problem.id, {...problem, note: nextNote});
        onUpdate(updated);
        setSaveSuccessVisible(true);
        successTimerRef.current = window.setTimeout(() => setSaveSuccessVisible(false), 3000);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }

  function updateDraft<K extends keyof Problem>(key: K, value: Problem[K]) {
    setDraft((prev) => ({...prev, [key]: value}));
  }

  // メタ保存
  async function handleMetaSave() {
    window.clearTimeout(timerRef.current ?? 0);
    setSaveSuccessVisible(false);
    setIsSaving(true);
    setMetaSaveError(null);
    try {
      const updated = await updateProblem(problem.id, {...draft, note});
      onUpdate(updated);
      if (updated.materialName) setLastUsedMaterial(updated.materialName);
      setIsEditingMeta(false);
      setSaveSuccessVisible(true);
      successTimerRef.current = window.setTimeout(() => setSaveSuccessVisible(false), 3000);
    } catch (e) {
      setMetaSaveError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete() {
    if (!confirm("本当に削除しますか？")) return;
    setDeleting(true);
    try {
      await deleteProblem(problem.id);
      onDelete(problem.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  const palette = subjectPalette(problem.subject, subjectColors[problem.subject]);

  return (
    <BottomSheet onClose={onClose} height="90vh" zIndex={zIndex}>
      {/* ヘッダー */}
      <div style={sheetFlexHeaderStyle}>
        <button onClick={onClose} disabled={isSaving} style={{...sheetCloseBtnStyle, opacity: isSaving ? 0.7 : 1}}>×</button>
        <div style={headerRight}>
          {(isSaving || saveSuccessVisible) && (
            <span style={isSaving ? saveLabelSaving : saveLabelSuccess}>
              {isSaving ? "保存中…" : "保存済み"}
            </span>
          )}
        </div>
      </div>

      <div
          style={{
            ...sheetBodyStyle,
            padding: '0 16px 20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflowY: 'auto',
          }}
      >
        {/* ── メタカード（ノート編集中は非表示） ── */}
        {!isEditingNote && (
          <div style={metaCard}>
            <div style={cardHeader}>
              <div style={{flex: 1, minWidth: 0}}>
                {/* 表示行: 科目タグ・教材・問番号・習熟度 */}
                <div style={metaChipsRow}>
                  <span style={{...subjectChip, backgroundColor: palette.bg, color: palette.color}}>
                    {problem.subject}
                  </span>
                  <span style={refText}>{[problem.materialName, problem.questionRef].filter(Boolean).join(' ')}</span>
                  <span style={{...profChip, backgroundColor: PROF_STYLE[problem.proficiency]?.bg ?? 'rgba(55,53,47,0.06)', color: PROF_STYLE[problem.proficiency]?.color ?? c.textSub}}>
                    {problem.proficiency}
                  </span>
                </div>
                {/* 小分類 + 属性チップ */}
                {(problem.subCategory ||
                    problem.failureTypes.length > 0 ||
                    problem.isFormula ||
                    problem.isGoodQuestion) && (
                    <div style={subMetaRow}>
                      {problem.subCategory && (
                          <span style={subCategoryText}>
                            {problem.subCategory}
                          </span>
                      )}

                      {(problem.failureTypes.length > 0 ||
                          problem.isFormula ||
                          problem.isGoodQuestion) && (
                          <div style={tagsRow}>
                            {problem.failureTypes.map((ft) => (
                                <span
                                    key={ft}
                                    style={{
                                      ...ftChip,
                                      color: FAILURE_COLORS[ft] ?? c.textSub,
                                      backgroundColor: `${FAILURE_COLORS[ft] ?? '#888'}18`,
                                      borderColor: `${FAILURE_COLORS[ft] ?? '#888'}30`,
                                    }}
                                >
            {ft}
          </span>
                            ))}
                            {problem.isFormula && (
                                <span style={formulaChip}>公式</span>
                            )}
                            {problem.isGoodQuestion && (
                                <span style={goodChip}>★ 良問</span>
                            )}
                          </div>
                      )}
                    </div>
                )}
              </div>
              {/* メタ編集トグルボタン */}
              <button
                onClick={() => setIsEditingMeta((v) => !v)}
                style={{...cardEditBtn, color: isEditingMeta ? c.blue : 'rgba(55,53,47,0.3)'}}
                title={isEditingMeta ? '編集を閉じる' : 'メタ情報を編集'}
              >
                {isEditingMeta ? <X size={16} /> : <Pencil size={16} />}
              </button>
            </div>

            {/* メタ編集フォーム */}
            {isEditingMeta && (
              <div style={editFormBody}>
                {/* 科目 */}
                <input
                  list="qm-subjects"
                  value={draft.subject}
                  onChange={(e) => updateDraft("subject", e.target.value)}
                  placeholder="科目"
                  style={{...notionMainInp, width: '100%'}}
                />
                <datalist id="qm-subjects">
                  {subjects.map((s) => <option key={s} value={s} />)}
                </datalist>

                {/* 教材 */}
                <input
                  list="qm-materials"
                  value={draft.materialName ?? ""}
                  onChange={(e) => updateDraft("materialName", e.target.value)}
                  placeholder="教材"
                  style={notionSubInp}
                />
                <datalist id="qm-materials">
                  {materials.map((m) => <option key={m} value={m} />)}
                </datalist>

                {/* 小分類 */}
                <input
                  list="qm-subcats"
                  value={draft.subCategory ?? ""}
                  onChange={(e) => updateDraft("subCategory", e.target.value)}
                  placeholder="小分類"
                  style={notionSubInp}
                />
                <datalist id="qm-subcats" key={draft.subject}>
                  {allSubCategories
                    .filter((x) => x.subject === draft.subject.trim())
                    .map((x) => <option key={x.id} value={x.name} />)}
                </datalist>

                {/* 問題番号 */}
                <input
                  value={draft.questionRef}
                  onChange={(e) => updateDraft("questionRef", e.target.value)}
                  placeholder="問題番号"
                  style={notionSubInp}
                />

                {/* 習熟度 */}
                <div>
                  <span style={{...tinyLabel, display: 'block', marginBottom: 6}}>習熟度</span>
                  <ProficiencySelector
                    mode="single"
                    value={draft.proficiency}
                    onChange={(p) => updateDraft("proficiency", p as Proficiency)}
                  />
                </div>

                {/* 属性 */}
                <div>
                  <span style={{...tinyLabel, display: 'block', marginBottom: 6}}>属性</span>
                  <FailureTypeSelector value={draft.failureTypes} onChange={(next) => updateDraft("failureTypes", next)} />
                </div>

                {/* 公式 / 良問トグル */}
                <div style={{display: 'flex', gap: 8}}>
                  <button
                    type="button"
                    onClick={() => updateDraft("isFormula", !draft.isFormula)}
                    style={{
                      padding: '4px 10px', borderRadius: '6px', border: '1px solid',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      borderColor: draft.isFormula ? 'rgba(35,131,226,0.4)' : 'rgba(55,53,47,0.15)',
                      backgroundColor: draft.isFormula ? 'rgba(35,131,226,0.07)' : 'transparent',
                      color: draft.isFormula ? 'rgba(35,131,226,1)' : 'rgba(55,53,47,0.4)',
                      transition: 'all 0.15s',
                    }}
                  >
                    公式
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDraft("isGoodQuestion", !draft.isGoodQuestion)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: '6px', border: '1px solid',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      borderColor: draft.isGoodQuestion ? 'rgba(234,179,8,0.4)' : 'rgba(55,53,47,0.15)',
                      backgroundColor: draft.isGoodQuestion ? 'rgba(254,249,195,0.6)' : 'transparent',
                      color: draft.isGoodQuestion ? '#92400e' : 'rgba(55,53,47,0.4)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Star size={12} fill={draft.isGoodQuestion ? 'currentColor' : 'none'} />
                    良問
                  </button>
                </div>

                {metaSaveError && (
                  <p style={{margin: '4px 0 0', fontSize: font.sm, color: c.red, fontWeight: 600}}>{metaSaveError}</p>
                )}

                <div style={metaSaveRow}>
                  <button onClick={() => setIsEditingMeta(false)} style={metaCancelBtn}>キャンセル</button>
                  <button onClick={handleMetaSave} disabled={isSaving} style={isSaving ? notionDisabledSaveBtn : notionSaveBtn}>
                    {isSaving ? "保存中…" : "保存"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ノートカード ── */}
        <div
            style={{
              ...sectionCard(isEditingNote),
              ...(isEditingNote && {
                flex: 1,
                minHeight: 0,
              }),
              display: 'flex',
              flexDirection: 'column',
            }}
        >
          <div
              style={{
                ...noteHeader,
                ...(isEditingNote
                    ? { borderBottom: `1px solid ${c.border}` }
                    : {
                      position: 'sticky',
                      top: SHEET_HEADER_H + META_GAP,
                      zIndex: 3,
                      backgroundColor: '#fff',
                      borderBottom: `1px solid ${c.border}`,
                    }),
              }}
          >
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button onClick={handleCopy} style={iconBtn} title="コピー">
                <Copy size={15} />
                {copied && <span style={{fontSize: "11px", color: "#19a576"}}>✓</span>}
              </button>
              <span style={cardSectionLabel}>&nbsp;&nbsp;ノート</span>
            </div>
            {/* ノート編集トグルボタン */}
            <button
              onClick={() => setIsEditingNote((v) => !v)}
              style={{...cardEditBtn, color: isEditingNote ? c.blue : 'rgba(55,53,47,0.3)'}}
              title={isEditingNote ? '編集を閉じる' : 'ノートを編集'}
            >
              {isEditingNote ? <X size={16} /> : <Pencil size={16} />}
            </button>
          </div>

          {isEditingNote ? (
              <div style={{flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0}}>
              <NoteEditor
                value={note}
                onChange={(v) => { setNote(v); scheduleSave(v); }}
                onBlur={() => scheduleSave(note)}
                stretch
              />
            </div>
          ) : (
            <div style={{padding: '4px 12px 12px'}}>
              <MarkdownContent>{note || ' '}</MarkdownContent>
            </div>
          )}
        </div>

        {/* ── 芋づる（ノート編集中は非表示） ── */}
        {!isEditingNote && onNavigate && (
          <RelatedProblemsSection
            current={problem}
            onSelect={(p) => { onClose(); onNavigate(p); }}
          />
        )}

        {/* ── 保存済みクイズ（ノート編集中は非表示） ── */}
        {!isEditingNote && !hideQuizzes && quizzes.length > 0 && (
          <div style={{marginBottom: 20}}>
            <button style={goodQuizBtn} onClick={handleStartGoodQuizSession}>
              <span style={goodQuizBtnLabel}>保存済み問題</span>
              <span style={goodQuizBtnCount}>{quizzes.length}問</span>
              <span style={goodQuizBtnArrow}>→</span>
            </button>
            <div style={quizList}>
              {quizzes.map((q) => (
                <div key={q.id} style={quizRow}>
                  <span style={quizRowText}>{q.question}</span>
                  <button style={quizDeleteBtn} onClick={() => handleDeleteQuiz(q.id)} aria-label="削除">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 削除ボタン（ノート編集中は非表示） */}
        {!isEditingNote && (
          <div style={{paddingBottom: 32}}>
            <LongPressButton onConfirm={handleDelete} disabled={deleting} style={deleteBtn}>この問題を削除</LongPressButton>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

// ── スタイル ─────────────────────────────────────────────────────────────────

function sectionCard(isEditing: boolean): React.CSSProperties {
  return {
    borderRadius: '12px',
    backgroundColor: isEditing ? 'rgba(35,131,226,0.015)' : '#fff',
    marginBottom: '14px',
    transition: 'border-color 0.15s',
  }
}

const cardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '10px 12px',
}

const noteHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '10px 12px',
}

const cardEditBtn: React.CSSProperties = {
  flexShrink: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: '2px',
  borderRadius: '4px',
}

const cardSectionLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: c.textHint,
  backgroundColor: '#fff',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const metaCard: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 4,
  backgroundColor: '#fff',
  paddingBottom: '8px',
}

const editFormBody: React.CSSProperties = {
  padding: '14px 12px 14px',
  borderTop: `1px solid ${c.border}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const SHEET_HEADER_H = 58
const META_GAP = 8

const subMetaRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginRight: '18px',
  gap: '6px',
  marginTop: 4,
}

const subCategoryText: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: c.text,
  lineHeight: 1.4,
}
const tagsRow: React.CSSProperties = {
  display: "flex",
  gap: "5px",
  flexWrap: "wrap",
}

const headerRight: React.CSSProperties = {display: "flex", alignItems: "center", gap: "12px"}
const iconBtn: React.CSSProperties = {border: "none", background: "none", color: 'rgba(55,53,47,0.4)', cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", padding: "2px 4px"}

const metaChipsRow: React.CSSProperties = {display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginBottom: 4}
const subjectChip: React.CSSProperties = {padding: "2px 7px", borderRadius: "4px", fontSize: font.xs, fontWeight: 700, letterSpacing: "0.02em"}
const refText: React.CSSProperties = {fontSize: font.sm, color: c.textFaint, fontWeight: 400}
const profChip: React.CSSProperties = {padding: "2px 7px", borderRadius: "4px", fontSize: font.xs, fontWeight: 700}
const ftChip: React.CSSProperties = {padding: "2px 7px", borderRadius: "4px", border: "1px solid", fontSize: font.xs, fontWeight: 600}
const formulaChip: React.CSSProperties = {padding: "2px 7px", borderRadius: "4px", border: "1px solid rgba(35,131,226,0.25)", fontSize: font.xs, fontWeight: 600, background: "rgba(35,131,226,0.06)", color: c.blue}
const goodChip: React.CSSProperties = {padding: "2px 7px", borderRadius: "4px", border: "1px solid rgba(234,179,8,0.3)", fontSize: font.xs, fontWeight: 600, background: "rgba(254,249,195,0.6)", color: "#92400e"}

const metaSaveRow: React.CSSProperties = {display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16}
const metaCancelBtn: React.CSSProperties = {padding: "6px 14px", fontSize: "12px", fontWeight: 600, color: "rgba(55,53,47,0.5)", border: "1px solid rgba(55,53,47,0.12)", borderRadius: 7, background: "transparent", cursor: "pointer"}

const saveLabelSuccess: React.CSSProperties = {fontSize: "12px", color: "#19a576"}
const saveLabelSaving: React.CSSProperties = {fontSize: "12px", color: c.textHint}

export const deleteBtn: React.CSSProperties = {padding: "8px 16px", backgroundColor: "transparent", border: "none", fontSize: "13px", width: "100%", color: "rgba(235, 87, 87, 0.6)", cursor: "pointer", fontWeight: 500}
const goodQuizBtn: React.CSSProperties = {width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "12px 14px", borderRadius: "10px", border: `1px solid rgba(234,179,8,0.35)`, backgroundColor: "rgba(254,249,195,0.5)", cursor: "pointer", textAlign: "left", marginBottom: 8}
const goodQuizBtnLabel: React.CSSProperties = {flex: 1, fontSize: "13px", fontWeight: 700, color: "#92400e"}
const goodQuizBtnCount: React.CSSProperties = {fontSize: "12px", fontWeight: 600, color: "#a16207", backgroundColor: "rgba(234,179,8,0.15)", padding: "2px 8px", borderRadius: "999px"}
const goodQuizBtnArrow: React.CSSProperties = {fontSize: "14px", color: "#a16207"}
const quizList: React.CSSProperties = {display: "flex", flexDirection: "column", gap: "1px"}
const quizRow: React.CSSProperties = {display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "6px", backgroundColor: "rgba(254,249,195,0.3)"}
const quizRowText: React.CSSProperties = {flex: 1, fontSize: "12px", color: c.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}
const quizDeleteBtn: React.CSSProperties = {flexShrink: 0, background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "rgba(55,53,47,0.3)", padding: "0 2px", lineHeight: 1}
