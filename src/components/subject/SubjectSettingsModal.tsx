import {useState} from 'react'
import {SubjectDangerZone} from '@/components/subject/SubjectDangerZone'
import {SUBJECT_COLOR_OPTIONS, subjectPalette} from '@/styles/subjectUI'
import type {SubjectAlertSettings, SubjectSettings} from '@/types/workspace'
import {useSettingsStore} from '@/lib/store/settings'
import {BottomSheet, sheetBottomCloseBtnStyle, sheetHeaderStyle} from '@/components/common/BottomSheet'

type Props = {
  subjectName: string
  settings: SubjectSettings
  setSettings: (v: any) => void
  saveSubjectSettings: (name: string, s: SubjectSettings) => void
  settingsLoaded: boolean
  subjectAlertSettings: SubjectAlertSettings
  setLocalSubjectAlertSettings: React.Dispatch<React.SetStateAction<SubjectAlertSettings>>
  handleAlertSave: () => void
  alertSaving: boolean
  alertSaved: boolean
  deleteSubject: (name: string) => Promise<void>
  subjects: string[]
  setSubjects: (v: string[]) => void
  navigate: (to: string) => void
  onClose: () => void
}

export function SubjectSettingsModal({
  subjectName, settings, setSettings, saveSubjectSettings, settingsLoaded,
  subjectAlertSettings, setLocalSubjectAlertSettings, handleAlertSave, alertSaving, alertSaved,
  deleteSubject, subjects, setSubjects, navigate, onClose,
}: Props) {
  const autoPalette = subjectPalette(subjectName)
  const setSubjectColor = useSettingsStore((s) => s.setSubjectColor)
  const [colorSaving, setColorSaving] = useState(false)

  const handleColorSelect = async (color: string | null) => {
    const next = { ...settings, themeColor: color }
    setSettings(next)
    setSubjectColor(subjectName, color)
    setColorSaving(true)
    try {
      await saveSubjectSettings(subjectName, next)
    } finally {
      setColorSaving(false)
    }
  }

  return (
    <BottomSheet onClose={onClose} maxWidth={600} maxHeight="85vh" paddingBottom="calc(40px + env(safe-area-inset-bottom, 0px))">
      <div style={sheetHeaderStyle}>
        <p style={sheetTitle}>設定</p>
      </div>

      <div style={body}>
        {/* THEME COLOR */}
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <p style={{ ...sectionLabel, margin: 0 }}>THEME COLOR</p>
            {colorSaving && <span style={savingLabel}>保存中…</span>}
          </div>
          {!settingsLoaded ? (
            <div style={swatchRow}>
              {Array.from({ length: 13 }).map((_, i) => (
                <div key={i} style={{ ...swatchBtn, backgroundColor: 'rgba(55,53,47,0.08)' }} />
              ))}
            </div>
          ) : (
            <>
              <div style={swatchRow}>
                <button style={{ ...swatchBtn, backgroundColor: autoPalette.color, outline: !settings.themeColor ? `2px solid ${autoPalette.color}` : 'none', outlineOffset: '2px', opacity: colorSaving ? 0.6 : 1 }} onClick={() => handleColorSelect(null)} disabled={colorSaving} title="自動">
                  {!settings.themeColor && <span style={swatchCheck}>✓</span>}
                </button>
                <div style={swatchDivider} />
                {SUBJECT_COLOR_OPTIONS.map((hex) => (
                  <button key={hex} style={{ ...swatchBtn, backgroundColor: hex, outline: settings.themeColor === hex ? `2px solid ${hex}` : 'none', outlineOffset: '2px', opacity: colorSaving ? 0.6 : 1 }} onClick={() => handleColorSelect(hex)} disabled={colorSaving} title={hex}>
                    {settings.themeColor === hex && <span style={swatchCheck}>✓</span>}
                  </button>
                ))}
              </div>
              <p style={hint}>{settings.themeColor ? `カスタム: ${settings.themeColor}` : '自動（科目名から自動生成）'}</p>
            </>
          )}
        </div>

        {/* ALERT */}
        <div style={section}>
          <p style={sectionLabel}>ALERT</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={alertBlock}>
              <label style={alertToggleRow}>
                <input type="checkbox" checked={subjectAlertSettings.touchAlertEnabled} onChange={(e) => setLocalSubjectAlertSettings((s) => ({ ...s, touchAlertEnabled: e.target.checked }))} style={{ marginRight: '8px' }} />
                <span style={alertToggleLabel}>条件1: 未接触アラート</span>
              </label>
              {subjectAlertSettings.touchAlertEnabled && (
                <div style={{ paddingLeft: '24px' }}>
                  <div style={alertInputRow}>
                    <span style={alertUnit}>直近</span>
                    <input type="number" min={1} max={30} value={subjectAlertSettings.thresholdDays} onChange={(e) => setLocalSubjectAlertSettings((s) => ({ ...s, thresholdDays: Number(e.target.value) }))} style={alertNumberInput} />
                    <span style={alertUnit}>日間未接触で警告</span>
                  </div>
                </div>
              )}
            </div>
            <div style={alertBlock}>
              <label style={alertToggleRow}>
                <input type="checkbox" checked={subjectAlertSettings.minutesAlertEnabled} onChange={(e) => setLocalSubjectAlertSettings((s) => ({ ...s, minutesAlertEnabled: e.target.checked }))} style={{ marginRight: '8px' }} />
                <span style={alertToggleLabel}>条件2: 学習時間不足アラート</span>
              </label>
              {subjectAlertSettings.minutesAlertEnabled && (
                <div style={{ paddingLeft: '24px' }}>
                  <div style={alertInputRow}>
                    <span style={alertUnit}>直近</span>
                    <input type="number" min={1} max={30} value={subjectAlertSettings.minutesThresholdDays} onChange={(e) => setLocalSubjectAlertSettings((s) => ({ ...s, minutesThresholdDays: Number(e.target.value) }))} style={alertNumberInput} />
                    <span style={alertUnit}>日間で</span>
                    <input type="number" min={1} max={600} value={subjectAlertSettings.minutesThreshold} onChange={(e) => setLocalSubjectAlertSettings((s) => ({ ...s, minutesThreshold: Number(e.target.value) }))} style={alertNumberInput} />
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

        {/* Close button */}
        <div style={{ paddingTop: '20px' }}>
          <button onClick={onClose} style={sheetBottomCloseBtnStyle}>閉じる</button>
        </div>

        {/* DANGER ZONE — Close より下に配置、スクロールが必要 */}
        <div style={{ paddingTop: '40px', paddingBottom: '12px' }}>
          <SubjectDangerZone subjectName={subjectName} deleteSubject={deleteSubject} subjects={subjects} setSubjects={setSubjects} navigate={navigate} />
        </div>
      </div>
    </BottomSheet>
  )
}

const sheetTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'rgba(55,53,47,0.9)', margin: 0 }
const body: React.CSSProperties = { padding: '8px 20px 8px', display: 'flex', flexDirection: 'column' }
const section: React.CSSProperties = { paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(55,53,47,0.06)' }
const sectionLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55,53,47,0.35)', letterSpacing: '0.06em', margin: '0 0 12px' }
const swatchRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }
const swatchBtn: React.CSSProperties = { width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }
const swatchCheck: React.CSSProperties = { color: '#fff', fontSize: '13px', fontWeight: 700, lineHeight: 1 }
const swatchDivider: React.CSSProperties = { width: '1px', height: '24px', backgroundColor: 'rgba(55,53,47,0.1)' }
const hint: React.CSSProperties = { fontSize: '11px', color: 'rgba(55,53,47,0.3)', margin: '8px 0 0' }
const alertBlock: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }
const alertToggleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', cursor: 'pointer' }
const alertToggleLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: 'rgba(55,53,47,0.8)' }
const alertInputRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }
const alertNumberInput: React.CSSProperties = { width: '52px', padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '13px', textAlign: 'center' }
const alertUnit: React.CSSProperties = { fontSize: '12px', color: 'rgba(55,53,47,0.6)' }
const saveBtn: React.CSSProperties = { fontSize: '12px', fontWeight: 600, border: '1px solid rgba(55,53,47,0.1)', background: 'white', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }
const savedText: React.CSSProperties = { fontSize: '12px', color: '#19a576' }
const savingLabel: React.CSSProperties = { fontSize: '11px', color: 'rgba(55,53,47,0.4)' }
