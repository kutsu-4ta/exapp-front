import type { StudySession, StudySessionInput, SubCategory } from "../../types/workspace";
import { useSettingsStore } from '../../lib/store/settings';
import { useId, useRef, useState } from "react";

type SaveInput = Omit<StudySessionInput, 'dailyLogDate' | 'timeSlot'>

type Props = {
  session?: StudySession
  initialMinutes?: number
  initialSubject?: string
  initialMaterial?: string
  subCategories?: SubCategory[]
  onSave: (currentId: number | null, input: SaveInput) => Promise<number>
  onDelete: (currentId: number | null) => Promise<void>
  readonly?: boolean
}

export function StudyBlockRow({ session, initialMinutes, initialSubject, initialMaterial, subCategories = [], onSave, onDelete, readonly }: Props) {
  const uid = useId();
  const subjects = useSettingsStore((s) => s.subjects);
  const materials = useSettingsStore((s) => s.materials);

  const savedIdRef = useRef<number | null>(session?.id ?? null);

  const [minutes, setMinutes] = useState<string>(String(session?.minutes ?? initialMinutes ?? ''));
  const [subject, setSubject] = useState(session?.subject ?? initialSubject ?? '');
  const [material, setMaterial] = useState(session?.material ?? initialMaterial ?? '');
  const [subCategoryName, setSubCategoryName] = useState<string>(
      session?.subCategoryId
          ? subCategories.find((sc) => sc.id === session.subCategoryId)?.name ?? ''
          : ''
  );
  const [memo, setMemo] = useState(session?.memo ?? '');

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const isValid = parseInt(minutes, 10) > 0 && subject.trim().length > 0;

  const handleManualSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setSaveError(null);

    const values: SaveInput = {
      minutes: parseInt(minutes, 10),
      subject: subject.trim(),
      material: material.trim() || '',
      subCategoryId: subCategories.find(
          (sc) => sc.subject === subject && sc.name === subCategoryName.trim()
      )?.id ?? null,
      memo: memo.trim() || null
    };

    try {
      const newId = await onSave(savedIdRef.current, values);
      savedIdRef.current = newId;
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存失敗');
    } finally {
      setSaving(false);
    }
  };

  async function handleDelete() {
    if (savedIdRef.current === null) {
      await onDelete(null);
      return;
    }
    setDeleteConfirming(true);
  }

  async function handleDeleteConfirmed() {
    setDeleteConfirming(false);
    setDeleting(true);
    try {
      await onDelete(savedIdRef.current);
    } finally {
      setDeleting(false);
    }
  }

  if (readonly) {
    return (
        <div style={readonlyRow}>
          <div style={timeBadge}>{minutes} min</div>
          <div style={contentLayout}>
            <span style={subjectText}>{subject}</span>
            {subCategoryName && <span style={tagStyle}>{subCategoryName}</span>}
            {material && <span style={materialText}>{material}</span>}
          </div>
          {memo && <p style={memoText}>{memo}</p>}
        </div>
    );
  }

  return (
      <div
          style={{
            ...editableRow,
            borderColor: isHovered ? 'rgba(55, 53, 47, 0.16)' : 'rgba(55, 53, 47, 0.08)',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
        {/* Upper Row: Time and Basic Info */}
        <div style={flexRow}>
          <div style={inputGroup}>
            <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                style={notionNumInp}
                placeholder="0"
            />
            <span style={unitText}>min</span>
          </div>

          <input
              list={`${uid}-subj`}
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setSubCategoryName('') }}
              placeholder="科目を選択または入力..."
              style={notionMainInp}
          />
          <datalist id={`${uid}-subj`}>{subjects.map((s) => (<option key={s} value={s} />))}</datalist>
        </div>

        {/* Middle Row: SubCategory and Material */}
        <div style={flexRowSecondary}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={tinyLabel}>SUB</span>
            <input
                list={`${uid}-subcat`}
                value={subCategoryName}
                onChange={(e) => setSubCategoryName(e.target.value)}
                placeholder="小分類"
                style={notionSubInp}
            />
            <datalist id={`${uid}-subcat`}>{subCategories.filter(sc => sc.subject === subject).map((sc) => (<option key={sc.id} value={sc.name} />))}</datalist>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={tinyLabel}>MAT</span>
            <input
                list={`${uid}-mat`}
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="教材"
                style={notionSubInp}
            />
            <datalist id={`${uid}-mat`}>{materials.map((m) => (<option key={m} value={m} />))}</datalist>
          </div>
        </div>

        {/* Lower Row: Memo and Actions */}
        <div style={{ ...flexRow, marginTop: '4px' }}>
          <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="備考を追加..."
              style={notionMemoInp}
          />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {deleteConfirming ? (
              <>
                <button onClick={handleDeleteConfirmed} disabled={deleting} style={notionDeleteConfirmBtn}>
                  {deleting ? '...' : '削除'}
                </button>
                <button onClick={() => setDeleteConfirming(false)} style={notionDeleteCancelBtn}>×</button>
              </>
            ) : (
              <button onClick={handleDelete} disabled={deleting} style={notionDeleteBtn}>削除</button>
            )}
            <button
                onClick={handleManualSave}
                disabled={!isValid || saving}
                style={{
                  ...notionSaveBtn,
                  backgroundColor: justSaved ? '#ebf5e9' : '#fff',
                  color: justSaved ? '#377d22' : '#37352f',
                  opacity: (!isValid || saving) && !justSaved ? 0.4 : 1,
                  cursor: !isValid || saving ? 'not-allowed' : 'pointer',
                }}
            >
              {saving ? '保存中...' : justSaved ? '完了' : '保存'}
            </button>
          </div>
        </div>

        {saveError && <p style={errorStyle}>{saveError}</p>}
      </div>
  );
}

// --- Notion Style Constants ---

const editableRow: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(55, 53, 47, 0.08)',
  borderRadius: '4px',
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  transition: 'border-color 0.2s ease',
  position: 'relative'
};

const flexRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const flexRowSecondary: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  paddingLeft: '4px'
};

const inputGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
  minWidth: '70px'
};

const notionNumInp: React.CSSProperties = {
  width: '38px',
  fontSize: '16px',
  fontWeight: 600,
  color: '#37352f',
  border: 'none',
  background: 'transparent',
  outline: 'none',
  textAlign: 'right'
};

const unitText: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(55, 53, 47, 0.4)',
  fontWeight: 400
};

const notionMainInp: React.CSSProperties = {
  flex: 1,
  fontSize: '16px',
  fontWeight: 600,
  color: '#37352f',
  border: 'none',
  background: 'transparent',
  outline: 'none',
};

const notionSubInp: React.CSSProperties = {
  width: '100%',
  fontSize: '16px',
  color: 'rgba(55, 53, 47, 0.65)',
  border: 'none',
  background: 'transparent',
  outline: 'none',
};

const notionMemoInp: React.CSSProperties = {
  flex: 1,
  fontSize: '16px',
  color: 'rgba(55, 53, 47, 0.5)',
  border: 'none',
  background: 'transparent',
  outline: 'none',
};

const tinyLabel: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  color: 'rgba(55, 53, 47, 0.25)',
  letterSpacing: '0.05em'
};

const notionSaveBtn: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  padding: '4px 10px',
  borderRadius: '3px',
  border: '1px solid rgba(55, 53, 47, 0.16)',
  cursor: 'pointer',
  background: '#fff',
  transition: 'background 0.2s',
};

const notionDeleteBtn: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(55, 53, 47, 0.4)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 8px',
};

const notionDeleteConfirmBtn: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#fff',
  background: '#eb5757',
  border: 'none',
  borderRadius: '3px',
  cursor: 'pointer',
  padding: '4px 8px',
};

const notionDeleteCancelBtn: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(55, 53, 47, 0.45)',
  background: 'none',
  border: '1px solid rgba(55, 53, 47, 0.16)',
  borderRadius: '3px',
  cursor: 'pointer',
  padding: '3px 7px',
};

// --- Readonly Styles ---
const readonlyRow: React.CSSProperties = {
  padding: '12px 14px',
  background: 'rgba(55, 53, 47, 0.02)',
  borderRadius: '4px',
  border: '1px solid transparent'
};

const timeBadge: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55, 53, 47, 0.45)',
  marginBottom: '4px'
};

const contentLayout: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
};

const subjectText: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#37352f'
};

const tagStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '1px 6px',
  background: 'rgba(55, 53, 47, 0.08)',
  borderRadius: '3px',
  color: '#37352f'
};

const materialText: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(55, 53, 47, 0.5)'
};

const memoText: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(55, 53, 47, 0.65)',
  marginTop: '6px',
  lineHeight: '1.5'
};

const errorStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#d4402d',
  marginTop: '4px'
};