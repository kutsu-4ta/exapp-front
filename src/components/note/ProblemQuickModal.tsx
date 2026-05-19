import {LongPressButton} from "@/components/common/LongPressButton.tsx";
import {FAILURE_COLORS, FailureTypeSelector} from "@/components/common/FailureTypeSlecter.tsx";
import {useEffect, useRef, useState} from "react";
import type {MorningQuizSession} from "../../lib/api/morningQuiz";
import type {Problem, ProblemQuiz, Proficiency} from "../../types/workspace";
import {PROFICIENCY_VALUES} from "../../types/workspace";
import {c, font} from "../../styles/notion";
import {PROF_STYLE, subjectPalette} from "@/styles/subjectUI.ts";
import {deleteProblem, deleteProblemQuiz, fetchProblemQuizzes, updateProblem} from "../../lib/api/problem";
import {Copy, Pencil} from "lucide-react";
import {MarkdownContent} from "@/components/common/MarkdownContent.tsx";
import {useNavigate} from "react-router-dom";
import {useSettingsStore} from "../../lib/store/settings";
import {BottomSheet, sheetBodyStyle, sheetCloseBtnStyle, sheetFlexHeaderStyle} from '@/components/common/BottomSheet'

type Props = {
  problem: Problem;
  onClose: () => void;
  onDelete: (id: number) => void;
  onUpdate: (problem: Problem) => void;
  hideQuizzes?: boolean;
};

export function ProblemQuickModal({ problem, onClose, onDelete, onUpdate, hideQuizzes = false }: Props) {
  const navigate = useNavigate();
  const setLastUsedMaterial = useSettingsStore((s) => s.setLastUsedMaterial);
  const subjectColors = useSettingsStore((s) => s.subjectColors);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [quizzes, setQuizzes] = useState<ProblemQuiz[]>([]);
  const [draft, setDraft] = useState<Problem>(problem);
  const [note, setNote] = useState(problem.note ?? "");
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (editing) setDraft(problem);
  }, [editing, problem]);

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
    if (hideQuizzes) return
    fetchProblemQuizzes(problem.id).then(setQuizzes).catch(() => {});
  }, [problem.id, hideQuizzes]);

  async function handleDeleteQuiz(quizId: number) {
    await deleteProblemQuiz(problem.id, quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  }

  async function handleStartGoodQuizSession() {
    const allQuizzes = await fetchProblemQuizzes(problem.id);
    const quizzes = allQuizzes.filter((q) => q.quizType === 'multiple_choice');
    if (quizzes.length === 0) return;
    const preloadedSession: MorningQuizSession = {
      session_id: `good-quiz-${problem.id}`,
      questions: quizzes.map((q) => ({
        id: String(problem.id), subject: problem.subject, sub_category: problem.subCategory ?? "",
        problem_context: { original_ref: problem.questionRef, user_memo: problem.note ?? "", material_name: null },
        quiz: { question: q.question, options: q.options, correct_index: q.correctIndex ?? 0, explanation: q.explanation },
      })),
    };
    onClose();
    navigate(`/subjects/${encodeURIComponent(problem.subject)}/flash-bugfix`, { state: { preloadedSession } });
  }

  function scheduleSave(nextNote: string) {
    setSaveSuccessVisible(false);
    setIsSaving(true);
    window.clearTimeout(timerRef.current ?? 0);
    timerRef.current = window.setTimeout(async () => {
      try {
        const updated = await updateProblem(problem.id, { ...problem, note: nextNote });
        onUpdate(updated);
        setSaveSuccessVisible(true);
        successTimerRef.current = window.setTimeout(() => setSaveSuccessVisible(false), 3000);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }

  function updateDraft<K extends keyof Problem>(key: K, value: Problem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleMetaSave() {
    window.clearTimeout(timerRef.current ?? 0);
    setSaveSuccessVisible(false);
    setIsSaving(true);
    try {
      const updated = await updateProblem(problem.id, { ...draft, note });
      onUpdate(updated);
      if (updated.materialName) setLastUsedMaterial(updated.materialName);
      setEditing(false);
      setSaveSuccessVisible(true);
      successTimerRef.current = window.setTimeout(() => setSaveSuccessVisible(false), 3000);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (e) { console.error(e); }
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

  return (
    <BottomSheet onClose={onClose} height="90vh">
      <div style={sheetFlexHeaderStyle}>
        <button onClick={onClose} disabled={isSaving} style={{ ...sheetCloseBtnStyle, opacity: isSaving ? 0.7 : 1 }}>×</button>
        <div style={headerRight}>
          {(isSaving || saveSuccessVisible) && (
            <span style={isSaving ? saveLabelSaving : saveLabelSuccess}>
              {isSaving ? "保存中…" : "保存済み"}
            </span>
          )}
          <button style={{ ...iconBtn, background: editing ? "#eef5ff" : "none", borderRadius: "6px" }} onClick={() => setEditing((v) => !v)} title={editing ? "編集終了" : "編集"}>
            <Pencil size={18} />
          </button>
        </div>
      </div>

      <div style={sheetBodyStyle}>
        <div style={metaRow}>
          {editing ? (
            <>
              <input style={{ ...tagInputBlue, backgroundColor: subjectPalette(draft.subject, subjectColors[draft.subject]).bg, color: subjectPalette(draft.subject, subjectColors[draft.subject]).color }} value={draft.subject} onChange={(e) => updateDraft("subject", e.target.value)} />
              <input style={tagInputGray} value={draft.materialName ?? ""} onChange={(e) => updateDraft("materialName", e.target.value)} />
              <input style={tagInputGray} value={draft.questionRef} onChange={(e) => updateDraft("questionRef", e.target.value)} />
            </>
          ) : (
            <>
              <span style={{ ...subjectChip, backgroundColor: subjectPalette(problem.subject, subjectColors[problem.subject]).bg, color: subjectPalette(problem.subject, subjectColors[problem.subject]).color }}>{problem.subject}</span>
              <span style={refText}>{[problem.materialName, problem.questionRef].filter(Boolean).join(' ')}</span>
              <span style={{ ...profChip, backgroundColor: PROF_STYLE[problem.proficiency]?.bg ?? 'rgba(55,53,47,0.06)', color: PROF_STYLE[problem.proficiency]?.color ?? c.textSub }}>{problem.proficiency}</span>
            </>
          )}
        </div>

        {editing ? (
          <input style={titleInput} value={draft.subCategory ?? ""} onChange={(e) => updateDraft("subCategory", e.target.value)} />
        ) : (
          <>
            <p style={questionRefStyle}>{problem.subCategory}</p>
            {(problem.failureTypes.length > 0 || problem.isFormula || problem.isGoodQuestion) && (
              <div style={tagsRow}>
                {problem.failureTypes.map((ft) => (
                  <span key={ft} style={{ ...ftChip, color: FAILURE_COLORS[ft] ?? c.textSub, backgroundColor: `${FAILURE_COLORS[ft] ?? '#888'}18`, borderColor: `${FAILURE_COLORS[ft] ?? '#888'}30` }}>{ft}</span>
                ))}
                {problem.isFormula && <span style={formulaChip}>公式</span>}
                {problem.isGoodQuestion && <span style={goodChip}>★ 良問</span>}
              </div>
            )}
          </>
        )}

        <div style={section}>
          {editing ? (
            <>
              <FailureTypeSelector value={draft.failureTypes} onChange={(next) => updateDraft("failureTypes", next)} />
              <div style={editSegControl}>
                {PROFICIENCY_VALUES.map((p) => (
                  <button key={p} onClick={() => updateDraft("proficiency", p as Proficiency)} style={{ ...editSegBtn, backgroundColor: draft.proficiency === p ? PROF_STYLE[p].bg : 'transparent', color: draft.proficiency === p ? PROF_STYLE[p].color : 'rgba(55,53,47,0.35)', fontWeight: draft.proficiency === p ? 700 : 400 }}>
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.isGoodQuestion} onChange={(e) => updateDraft("isGoodQuestion", e.target.checked)} />良問
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.isFormula} onChange={(e) => updateDraft("isFormula", e.target.checked)} />公式
                </label>
              </div>
              <div style={metaSaveRow}>
                <button onClick={() => { setEditing(false); setDraft(problem); }} style={metaCancelBtn}>キャンセル</button>
                <button onClick={handleMetaSave} disabled={isSaving} style={{ ...metaConfirmBtn, opacity: isSaving ? 0.6 : 1 }}>
                  {isSaving ? "保存中…" : "保存"}
                </button>
              </div>
            </>
          ) : null}
        </div>

        <div style={section}>
          {!editing && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={sectionLbl}>ノート</p>
              <button onClick={handleCopy} style={iconBtn} title="コピー">
                <Copy size={18} />
                {copied && <span style={{ fontSize: "12px", color: "#19a576" }}>✓</span>}
              </button>
            </div>
          )}
          {editing ? (
            <textarea value={note} onChange={(e) => { const v = e.target.value; setNote(v); scheduleSave(v) }} style={noteTextarea} placeholder="ノートをとる..." />
          ) : (
            <div style={markdownPreview}><MarkdownContent>{note}</MarkdownContent></div>
          )}
        </div>

        {!hideQuizzes && quizzes.length > 0 && (
          <div style={section}>
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

        <div style={{ paddingBottom: 32 }}>
          <LongPressButton onConfirm={handleDelete} disabled={deleting} style={deleteBtn}>この問題を削除</LongPressButton>
        </div>
      </div>
    </BottomSheet>
  );
}

const headerRight: React.CSSProperties = { display: "flex", alignItems: "center", gap: "12px" }
const iconBtn: React.CSSProperties = { border: "none", background: "none", color: c.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: "4px" }
const metaRow: React.CSSProperties = { display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginBottom: "10px" }
const subjectChip: React.CSSProperties = { padding: "2px 7px", borderRadius: "4px", background: "rgba(35,131,226,0.08)", color: c.blue, fontSize: font.xs, fontWeight: 700, letterSpacing: "0.02em" }
const refText: React.CSSProperties = { fontSize: font.sm, color: c.textFaint, fontWeight: 400 }
const profChip: React.CSSProperties = { padding: "2px 7px", borderRadius: "4px", fontSize: font.xs, fontWeight: 700 }
const tagsRow: React.CSSProperties = { display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "16px", marginTop: "6px" }
const ftChip: React.CSSProperties = { padding: "2px 7px", borderRadius: "4px", border: "1px solid", fontSize: font.xs, fontWeight: 600 }
const formulaChip: React.CSSProperties = { padding: "2px 7px", borderRadius: "4px", border: "1px solid rgba(35,131,226,0.25)", fontSize: font.xs, fontWeight: 600, background: "rgba(35,131,226,0.06)", color: c.blue }
const goodChip: React.CSSProperties = { padding: "2px 7px", borderRadius: "4px", border: "1px solid rgba(234,179,8,0.3)", fontSize: font.xs, fontWeight: 600, background: "rgba(254,249,195,0.6)", color: "#92400e" }
const editSegControl: React.CSSProperties = { display: "flex", gap: "4px", backgroundColor: "rgba(55,53,47,0.05)", borderRadius: "8px", padding: "3px", marginTop: "14px" }
const editSegBtn: React.CSSProperties = { flex: 1, border: "none", borderRadius: "6px", padding: "8px", fontSize: "18px", cursor: "pointer", transition: "all 0.15s" }
const tagInputBlue: React.CSSProperties = { ...subjectChip, border: `1px solid ${c.border}`, outline: "none" }
const tagInputGray: React.CSSProperties = { padding: "4px 8px", borderRadius: "4px", background: "rgba(55,53,47,0.05)", color: c.textSub, fontSize: font.sm, border: `1px solid ${c.border}`, outline: "none" }
const questionRefStyle: React.CSSProperties = { fontSize: "17px", fontWeight: 700, color: c.text, lineHeight: 1.45, marginBottom: "4px" }
const titleInput: React.CSSProperties = { width: "100%", fontSize: "18px", fontWeight: 600, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "8px 10px", marginBottom: "20px" }
const section: React.CSSProperties = { marginBottom: "20px" }
const sectionLbl: React.CSSProperties = { fontSize: "12px", color: c.textSub, marginBottom: "8px" }
const noteTextarea: React.CSSProperties = { width: "100%", minHeight: "500px", padding: "12px", borderRadius: "8px", border: `1px solid ${c.border}`, fontSize: "15px", lineHeight: 1.7, resize: "none" }
const markdownPreview: React.CSSProperties = { padding: "12px", borderRadius: "8px", border: `1px solid ${c.border}`, minHeight: "500px", fontSize: "15px", lineHeight: 1.7 }
const saveLabelSuccess: React.CSSProperties = { fontSize: "12px", color: "#19a576" }
const saveLabelSaving: React.CSSProperties = { fontSize: "12px", color: "#19a576" }
const metaSaveRow: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }
const metaCancelBtn: React.CSSProperties = { padding: "6px 14px", fontSize: "12px", fontWeight: 600, color: "rgba(55,53,47,0.5)", border: "1px solid rgba(55,53,47,0.12)", borderRadius: 7, background: "transparent", cursor: "pointer" }
const metaConfirmBtn: React.CSSProperties = { padding: "6px 18px", fontSize: "12px", fontWeight: 700, color: "#fff", backgroundColor: "#2383e2", border: "none", borderRadius: 7, cursor: "pointer" }
export const deleteBtn: React.CSSProperties = { padding: "8px 16px", backgroundColor: "transparent", border: "none", fontSize: "13px", width: "100%", color: "rgba(235, 87, 87, 0.6)", cursor: "pointer", fontWeight: 500 }
const goodQuizBtn: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "12px 14px", borderRadius: "10px", border: `1px solid rgba(234,179,8,0.35)`, backgroundColor: "rgba(254,249,195,0.5)", cursor: "pointer", textAlign: "left" }
const goodQuizBtnLabel: React.CSSProperties = { flex: 1, fontSize: "13px", fontWeight: 700, color: "#92400e" }
const goodQuizBtnCount: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#a16207", backgroundColor: "rgba(234,179,8,0.15)", padding: "2px 8px", borderRadius: "999px" }
const goodQuizBtnArrow: React.CSSProperties = { fontSize: "14px", color: "#a16207" }
const quizList: React.CSSProperties = { marginTop: "6px", display: "flex", flexDirection: "column", gap: "1px" }
const quizRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "6px", backgroundColor: "rgba(254,249,195,0.3)" }
const quizRowText: React.CSSProperties = { flex: 1, fontSize: "12px", color: c.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
const quizDeleteBtn: React.CSSProperties = { flexShrink: 0, background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "rgba(55,53,47,0.3)", padding: "0 2px", lineHeight: 1 }
