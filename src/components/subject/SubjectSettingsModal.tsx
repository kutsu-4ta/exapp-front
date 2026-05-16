import {addSubCategory, deleteSubCategory, updateSubCategory} from '@/lib/api/subcategory'
import {SubCategoryList} from '@/components/subject/SubCategoryList'
import {SubjectDangerZone} from '@/components/subject/SubjectDangerZone'
import {SUBJECT_COLOR_OPTIONS, subjectPalette} from '@/styles/subjectUI'
import type {SubCategory, SubjectAlertSettings, SubjectSettings} from '@/types/workspace'

type Props = {
  subjectName: string
  // theme color
  settings: SubjectSettings
  setSettings: (v: any) => void
  saveSubjectSettings: (name: string, s: SubjectSettings) => void
  settingsLoaded: boolean
  // alert
  subjectAlertSettings: SubjectAlertSettings
  setLocalSubjectAlertSettings: React.Dispatch<React.SetStateAction<SubjectAlertSettings>>
  handleAlertSave: () => void
  alertSaving: boolean
  alertSaved: boolean
  // subcategory
  subCategories: SubCategory[]
  setSubCategories: (v: SubCategory[]) => void
  // danger zone
  deleteSubject: (name: string) => Promise<void>
  subjects: string[]
  setSubjects: (v: string[]) => void
  navigate: (to: string) => void
  // close
  onClose: () => void
}

export function SubjectSettingsModal({
  subjectName,
  settings,
  setSettings,
  saveSubjectSettings,
  settingsLoaded,
  subjectAlertSettings,
  setLocalSubjectAlertSettings,
  handleAlertSave,
  alertSaving,
  alertSaved,
  subCategories,
  setSubCategories,
  deleteSubject,
  subjects,
  setSubjects,
  navigate,
  onClose,
}: Props) {
  const autoPalette = subjectPalette(subjectName)

  const handleColorSelect = (color: string | null) => {
    const next = { ...settings, themeColor: color }
    setSettings(next)
    saveSubjectSettings(subjectName, next)
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={handle} />

        <div style={sheetHeader}>
          <p style={sheetTitle}>設定</p>
          <button style={closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={body}>

          {/* THEME COLOR */}
          <div style={section}>
            <p style={sectionLabel}>THEME COLOR</p>
            {!settingsLoaded ? (
              <div style={swatchRow}>
                {[0,1,2,3,4,5,6].map((i) => (
                  <div key={i} style={{ ...swatchBtn, backgroundColor: 'rgba(55,53,47,0.08)' }} />
                ))}
              </div>
            ) : (
              <>
                <div style={swatchRow}>
                  <button
                    style={{
                      ...swatchBtn,
                      backgroundColor: autoPalette.color,
                      outline: !settings.themeColor ? `2px solid ${autoPalette.color}` : 'none',
                      outlineOffset: '2px',
                    }}
                    onClick={() => handleColorSelect(null)}
                    title="自動"
                  >
                    {!settings.themeColor && <span style={swatchCheck}>✓</span>}
                  </button>
                  <div style={swatchDivider} />
                  {SUBJECT_COLOR_OPTIONS.map((hex) => (
                    <button
                      key={hex}
                      style={{
                        ...swatchBtn,
                        backgroundColor: hex,
                        outline: settings.themeColor === hex ? `2px solid ${hex}` : 'none',
                        outlineOffset: '2px',
                      }}
                      onClick={() => handleColorSelect(hex)}
                      title={hex}
                    >
                      {settings.themeColor === hex && <span style={swatchCheck}>✓</span>}
                    </button>
                  ))}
                </div>
                <p style={hint}>
                  {settings.themeColor ? `カスタム: ${settings.themeColor}` : '自動（科目名から自動生成）'}
                </p>
              </>
            )}
          </div>

          {/* ALERT */}
          <div style={section}>
            <p style={sectionLabel}>ALERT</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 条件1 */}
              <div style={alertBlock}>
                <label style={alertToggleRow}>
                  <input
                    type="checkbox"
                    checked={subjectAlertSettings.touchAlertEnabled}
                    onChange={(e) =>
                      setLocalSubjectAlertSettings((s) => ({ ...s, touchAlertEnabled: e.target.checked }))
                    }
                    style={{ marginRight: '8px' }}
                  />
                  <span style={alertToggleLabel}>条件1: 未接触アラート</span>
                </label>
                {subjectAlertSettings.touchAlertEnabled && (
                  <div style={{ paddingLeft: '24px' }}>
                    <div style={alertInputRow}>
                      <span style={alertUnit}>直近</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={subjectAlertSettings.thresholdDays}
                        onChange={(e) =>
                          setLocalSubjectAlertSettings((s) => ({ ...s, thresholdDays: Number(e.target.value) }))
                        }
                        style={alertNumberInput}
                      />
                      <span style={alertUnit}>日間未接触で警告</span>
                    </div>
                  </div>
                )}
              </div>
              {/* 条件2 */}
              <div style={alertBlock}>
                <label style={alertToggleRow}>
                  <input
                    type="checkbox"
                    checked={subjectAlertSettings.minutesAlertEnabled}
                    onChange={(e) =>
                      setLocalSubjectAlertSettings((s) => ({ ...s, minutesAlertEnabled: e.target.checked }))
                    }
                    style={{ marginRight: '8px' }}
                  />
                  <span style={alertToggleLabel}>条件2: 学習時間不足アラート</span>
                </label>
                {subjectAlertSettings.minutesAlertEnabled && (
                  <div style={{ paddingLeft: '24px' }}>
                    <div style={alertInputRow}>
                      <span style={alertUnit}>直近</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={subjectAlertSettings.minutesThresholdDays}
                        onChange={(e) =>
                          setLocalSubjectAlertSettings((s) => ({ ...s, minutesThresholdDays: Number(e.target.value) }))
                        }
                        style={alertNumberInput}
                      />
                      <span style={alertUnit}>日間で</span>
                      <input
                        type="number"
                        min={1}
                        max={600}
                        value={subjectAlertSettings.minutesThreshold}
                        onChange={(e) =>
                          setLocalSubjectAlertSettings((s) => ({ ...s, minutesThreshold: Number(e.target.value) }))
                        }
                        style={alertNumberInput}
                      />
                      <span style={alertUnit}>分未満で警告</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button style={saveBtn} onClick={handleAlertSave} disabled={alertSaving}>
                  {alertSaving ? '保存中...' : '保存'}
                </button>
                {alertSaved && <span style={savedText}>保存しました</span>}
              </div>
            </div>
          </div>

          {/* SUBCATEGORY */}
          <div style={section}>
            <p style={sectionLabel}>SUB CATEGORIES</p>
            <SubCategoryList
              subjectName={subjectName}
              subCategories={subCategories}
              setSubCategories={setSubCategories}
              addSubCategory={addSubCategory}
              updateSubCategory={updateSubCategory}
              deleteSubCategory={deleteSubCategory}
            />
          </div>

          {/* DANGER ZONE */}
          <div style={{ paddingTop: '20px' }}>
            <SubjectDangerZone
              subjectName={subjectName}
              deleteSubject={deleteSubject}
              subjects={subjects}
              setSubjects={setSubjects}
              subCategories={subCategories}
              setSubCategories={setSubCategories}
              navigate={navigate}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 300,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'flex-end',
}
const sheet: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#fff',
  borderRadius: '20px 20px 0 0',
  maxHeight: '85vh',
  overflowY: 'auto',
  paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
}
const handle: React.CSSProperties = {
  width: '36px',
  height: '4px',
  borderRadius: '2px',
  backgroundColor: 'rgba(55,53,47,0.15)',
  margin: '12px auto 0',
}
const sheetHeader: React.CSSProperties = {
  position: 'relative',
  padding: '16px 48px 14px 20px',
  borderBottom: '1px solid rgba(55,53,47,0.08)',
}
const sheetTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.9)',
  margin: 0,
}
const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: '14px',
  right: '16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(55,53,47,0.3)',
  fontSize: '18px',
  padding: '4px',
  borderRadius: '4px',
}
const body: React.CSSProperties = {
  padding: '8px 20px 8px',
  display: 'flex',
  flexDirection: 'column',
}
const section: React.CSSProperties = {
  paddingTop: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid rgba(55,53,47,0.06)',
}
const sectionLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.35)',
  letterSpacing: '0.06em',
  margin: '0 0 12px',
}
const swatchRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
}
const swatchBtn: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  flexShrink: 0,
}
const swatchCheck: React.CSSProperties = {
  color: '#fff',
  fontSize: '13px',
  fontWeight: 700,
  lineHeight: 1,
}
const swatchDivider: React.CSSProperties = {
  width: '1px',
  height: '24px',
  backgroundColor: 'rgba(55,53,47,0.1)',
}
const hint: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(55,53,47,0.3)',
  margin: '8px 0 0',
}
const alertBlock: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }
const alertToggleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', cursor: 'pointer' }
const alertToggleLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: 'rgba(55,53,47,0.8)' }
const alertInputRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }
const alertNumberInput: React.CSSProperties = { width: '52px', padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '13px', textAlign: 'center' }
const alertUnit: React.CSSProperties = { fontSize: '12px', color: 'rgba(55,53,47,0.6)' }
const saveBtn: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  border: '1px solid rgba(55,53,47,0.1)',
  background: 'white',
  borderRadius: '6px',
  padding: '6px 14px',
  cursor: 'pointer',
}
const savedText: React.CSSProperties = { fontSize: '12px', color: '#19a576' }
