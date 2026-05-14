import {LongPressButton} from "@/components/common/LongPressButton.tsx";
import {FailureTypeSelector} from "@/components/common/FailureTypeSlecter.tsx";
import {useEffect, useRef, useState} from "react";
import type {Problem} from "../../types/workspace";
import {c, font} from "../../styles/notion";
import {deleteProblem, updateProblem} from "../../lib/api/problem";
import {Copy, Pencil} from "lucide-react";
import {MarkdownContent} from "@/components/common/MarkdownContent.tsx";

type Props = {
  problem: Problem;
  onClose: () => void;
  onDelete: (id: number) => void;
  onUpdate: (problem: Problem) => void;
};

export function ProblemQuickModal({
                                    problem,
                                    onClose,
                                    onDelete,
                                    onUpdate,
                                  }: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [draft, setDraft] = useState<Problem>(problem);
  const [note, setNote] = useState(problem.note ?? "");

  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(problem);
    }
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

  function scheduleSave(nextNote: string, nextDraft?: Problem) {
    setSaveSuccessVisible(false);
    setIsSaving(true);

    window.clearTimeout(timerRef.current ?? 0);

    timerRef.current = window.setTimeout(async () => {
      try {
        const updated = await updateProblem(problem.id, {
          ...(nextDraft ?? draft),
          note: nextNote,
        });

        onUpdate(updated);

        setSaveSuccessVisible(true);

        successTimerRef.current = window.setTimeout(() => {
          setSaveSuccessVisible(false);
        }, 3000);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }

  function updateDraft<K extends keyof Problem>(
      key: K,
      value: Problem[K]
  ) {
    const next = {
      ...draft,
      [key]: value,
    };

    setDraft(next);
    scheduleSave(note, next);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
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

  return (
      <div style={overlay} onClick={onClose}>
        <div style={sheet} onClick={(e) => e.stopPropagation()}>
          <div style={handle} />

          <div style={header}>
            <button
                onClick={onClose}
                disabled={isSaving}
                style={{
                  ...closeBtn,
                  opacity: isSaving ? 0.7 : 1,
                }}
            >
              ×
            </button>

            <div style={headerRight}>
              {(isSaving || saveSuccessVisible) && (
                  <span
                      style={
                        isSaving ? saveLabelSaving : saveLabelSuccess
                      }
                  >
                {isSaving ? "保存中…" : "自動保存済み"}
              </span>
              )}

              <button
                  style={{
                    ...iconBtn,
                    background: editing ? "#eef5ff" : "none",
                    borderRadius: "6px",
                  }}
                  onClick={() => setEditing((v) => !v)}
                  title={editing ? "編集終了" : "編集"}
              >
                <Pencil size={18} />
              </button>
            </div>
          </div>

          <div style={body}>
            {/* META */}
            <div style={metaRow}>
              {editing ? (
                  <>
                    <input
                        style={tagInputBlue}
                        value={draft.subject}
                        onChange={(e) =>
                            updateDraft("subject", e.target.value)
                        }
                    />

                    <input
                        style={tagInputGray}
                        value={draft.materialName ?? ""}
                        onChange={(e) =>
                            updateDraft(
                                "materialName",
                                e.target.value
                            )
                        }
                    />

                    <input
                        style={tagInputGray}
                        value={draft.questionRef}
                        onChange={(e) =>
                            updateDraft(
                                "questionRef",
                                e.target.value
                            )
                        }
                    />
                  </>
              ) : (
                  <>
                <span style={subjectTag}>
                  {problem.subject}
                </span>
                    <span style={subCatTag}>
                  {problem.materialName}{" "}
                      {problem.questionRef}
                </span>
                    {problem.isGoodQuestion && (
                        <span style={starTag}>★ 良問</span>
                    )}
                  </>
              )}
            </div>

            {editing ? (
                <input
                    style={titleInput}
                    value={draft.subCategory ?? ""}
                    onChange={(e) =>
                        updateDraft(
                            "subCategory",
                            e.target.value
                        )
                    }
                />
            ) : (
                <p style={questionRefStyle}>
                  {problem.subCategory}
                </p>
            )}

            <div style={section}>
              {editing ? (
                  <>
                <textarea
                    style={factorTextarea}
                    value={draft.defeatReason ?? ""}
                    onChange={(e) =>
                        updateDraft(
                            "defeatReason",
                            e.target.value
                        )
                    }
                    placeholder="敗因"
                />

                    <FailureTypeSelector
                        value={draft.failureTypes}
                        onChange={(next) =>
                            updateDraft(
                                "failureTypes",
                                next
                            )
                        }
                    />

                    <label
                        style={{
                          display: "block",
                          marginTop: 16,
                        }}
                    >
                      <input
                          type="checkbox"
                          checked={draft.isGoodQuestion}
                          onChange={(e) =>
                              updateDraft(
                                  "isGoodQuestion",
                                  e.target.checked
                              )
                          }
                      />
                      良問
                    </label>
                  </>
              ) : (
                  <>
                    {problem.failureTypes.length > 0 && (
                        <div style={pillsRow}>
                          {problem.failureTypes.map((ft) => (
                              <span
                                  key={ft}
                                  style={pill}
                              >
                        {ft}
                      </span>
                          ))}
                        </div>
                    )}

                    {problem.defeatReason && (
                        <>
                          <p style={sectionLbl}>敗因</p>
                          <div style={defeatBox}>
                            {problem.defeatReason}
                          </div>
                        </>
                    )}
                  </>
              )}
            </div>

            {/* NOTE */}
            <div style={section}>
              {!editing && (
                  <div
                      style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                      }}
                  >
                    <p style={sectionLbl}>ノート</p>

                    <button
                        onClick={handleCopy}
                        style={iconBtn}
                        title="コピー"
                    >
                      <Copy size={18} />
                      {copied && (
                          <span
                              style={{
                                fontSize: "12px",
                                color: "#19a576",
                              }}
                          >
                      ✓
                    </span>
                      )}
                    </button>
                  </div>
              )}

              {editing ? (
                  <textarea
                      value={note}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNote(v);
                        scheduleSave(v);
                      }}
                      style={noteTextarea}
                      placeholder="ノートをとる..."
                  />
              ) : (
                  <div style={markdownPreview}>
                    <MarkdownContent>
                      {note}
                    </MarkdownContent>
                  </div>
              )}
            </div>

            <div style={{ paddingBottom: 32 }}>
              <LongPressButton
                  onConfirm={handleDelete}
                  disabled={deleting}
                  style={deleteBtn}
              >
                この問題を削除
              </LongPressButton>
            </div>
          </div>
        </div>
      </div>
  );
}

/* styles */

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 200,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "flex-end",
};

const sheet: React.CSSProperties = {
  width: "100%",
  maxWidth: "720px",
  margin: "0 auto",
  backgroundColor: "#fff",
  borderRadius: "16px 16px 0 0",
  height: "90vh",
  display: "flex",
  flexDirection: "column",
};

const handle = {
  width: "36px",
  height: "4px",
  borderRadius: "2px",
  background: "rgba(55,53,47,0.15)",
  margin: "10px auto 0",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px 16px",
  borderBottom: `1px solid ${c.border}`,
};

const body: React.CSSProperties = {
  padding: "20px 16px",
  overflowY: "auto",
  flex: 1,
};

const closeBtn = {
  border: "none",
  background: "none",
};

const iconBtn: React.CSSProperties = {
  border: "none",
  background: "none",
  color: c.blue,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px",
};

const metaRow = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
  marginBottom: "16px",
};

const subjectTag = {
  padding: "4px 8px",
  borderRadius: "6px",
  background: "#eef5ff",
  color: c.blue,
  fontSize: font.sm,
};

const subCatTag = {
  padding: "4px 8px",
  borderRadius: "6px",
  background: "#f6f6f6",
  color: c.textSub,
};

const starTag = {
  padding: "4px 8px",
  borderRadius: "6px",
  background: "#fff8df",
};

const tagInputBlue = {
  ...subjectTag,
  border: `1px solid ${c.border}`,
  outline: "none",
};

const tagInputGray = {
  ...subCatTag,
  border: `1px solid ${c.border}`,
  outline: "none",
};

const questionRefStyle = {
  fontSize: "18px",
  fontWeight: 600,
  marginBottom: "20px",
};

const titleInput = {
  width: "100%",
  fontSize: "18px",
  fontWeight: 600,
  border: `1px solid ${c.border}`,
  borderRadius: "8px",
  padding: "8px 10px",
  marginBottom: "20px",
};

const section = {
  marginBottom: "20px",
};

const sectionLbl = {
  fontSize: "12px",
  color: c.textSub,
  marginBottom: "8px",
};

const pillsRow = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "6px",
};

const pill = {
  padding: "4px 10px",
  borderRadius: "999px",
  background: "#f3f3f3",
};

const defeatBox = {
  padding: "12px",
  borderRadius: "8px",
  color: c.red,
  background: "rgba(235,87,87,0.04)",
};

const factorTextarea: React.CSSProperties = {
  width: "100%",
  minHeight: "80px",
  padding: "12px",
  borderRadius: "8px",
  border: `1px solid ${c.border}`,
  fontSize: "15px",
  lineHeight: 1.7,
  resize: "none",
  marginBottom: "12px",
};

const noteTextarea: React.CSSProperties = {
  width: "100%",
  minHeight: "500px",
  padding: "12px",
  borderRadius: "8px",
  border: `1px solid ${c.border}`,
  fontSize: "15px",
  lineHeight: 1.7,
  resize: "none",
};

const markdownPreview: React.CSSProperties = {
  padding: "12px",
  borderRadius: "8px",
  border: `1px solid ${c.border}`,
  minHeight: "500px",
  fontSize: "15px",
  lineHeight: 1.7,
};

const saveLabelSuccess = {
  fontSize: "12px",
  color: "#19a576",
};

const saveLabelSaving = {
  fontSize: "12px",
  color: "#19a576",
};

const deleteBtn: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "transparent",
  border: "none",
  fontSize: "13px",
  width: "100%",
  color: "rgba(235, 87, 87, 0.6)",
  cursor: "pointer",
  fontWeight: 500,
};

const headerRight: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};