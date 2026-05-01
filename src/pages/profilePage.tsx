import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store/auth'
import { useSettingsStore } from '../lib/store/settings'
import { logout as apiLogout } from '../lib/api/authenticate'
import { renameSubject, deleteSubject } from '../lib/api/subjects'
import { renameMaterial, deleteMaterial } from '../lib/api/materials'
import { updateSubCategory, deleteSubCategory } from '../lib/api/subcategory'
import { updateAlertSettings } from '../lib/api/alertSettings'
import type { SubCategory } from '../types/workspace'
import { c, font } from '../styles/notion'

export default function ProfilePage() {
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)
    const clearAuth = useAuthStore((state) => state.logout)

    const subjects = useSettingsStore((s) => s.subjects)
    const setSubjects = useSettingsStore((s) => s.setSubjects)
    const loadSubjects = useSettingsStore((s) => s.loadSubjects)

    const materials = useSettingsStore((s) => s.materials)
    const setMaterials = useSettingsStore((s) => s.setMaterials)
    const loadMaterials = useSettingsStore((s) => s.loadMaterials)

    const subCategories = useSettingsStore((s) => s.subCategories)
    const setSubCategories = useSettingsStore((s) => s.setSubCategories)
    const loadSubCategories = useSettingsStore((s) => s.loadSubCategories)

    const alertSettings = useSettingsStore((s) => s.alertSettings)
    const setAlertSettings = useSettingsStore((s) => s.setAlertSettings)
    const loadAlertSettings = useSettingsStore((s) => s.loadAlertSettings)

    // ── Subject editing ──────────────────────────────────────────────────────
    const [editingSubject, setEditingSubject] = useState<string | null>(null)
    const [editingSubjectValue, setEditingSubjectValue] = useState('')
    const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<string | null>(null)
    const [subjectError, setSubjectError] = useState<string | null>(null)
    const [subjectLoading, setSubjectLoading] = useState(false)
    const subjectEditRef = useRef<HTMLInputElement>(null)

    // ── Material editing ─────────────────────────────────────────────────────
    const [editingMaterial, setEditingMaterial] = useState<string | null>(null)
    const [editingMaterialValue, setEditingMaterialValue] = useState('')
    const [deleteMaterialTarget, setDeleteMaterialTarget] = useState<string | null>(null)
    const [materialError, setMaterialError] = useState<string | null>(null)
    const [materialLoading, setMaterialLoading] = useState(false)
    const materialEditRef = useRef<HTMLInputElement>(null)

    // ── SubCategory editing ──────────────────────────────────────────────────
    const [editingSubCat, setEditingSubCat] = useState<number | null>(null)
    const [editingSubCatValue, setEditingSubCatValue] = useState('')
    const [deleteSubCatTarget, setDeleteSubCatTarget] = useState<SubCategory | null>(null)
    const [subCatError, setSubCatError] = useState<string | null>(null)
    const [subCatLoading, setSubCatLoading] = useState(false)
    const subCatEditRef = useRef<HTMLInputElement>(null)

    // ── Alert settings ───────────────────────────────────────────────────────
    const [alertThreshold, setAlertThreshold] = useState(alertSettings.thresholdDays)
    const [alertIncludeUntouched, setAlertIncludeUntouched] = useState(alertSettings.includeUntouched)
    const [alertError, setAlertError] = useState<string | null>(null)
    const [alertLoading, setAlertLoading] = useState(false)
    const [alertSaved, setAlertSaved] = useState(false)

    useEffect(() => {
        loadSubjects()
        loadMaterials()
        loadSubCategories()
        loadAlertSettings()
    }, [])

    useEffect(() => {
        setAlertThreshold(alertSettings.thresholdDays)
        setAlertIncludeUntouched(alertSettings.includeUntouched)
    }, [alertSettings])

    useEffect(() => {
        if (editingSubject !== null) subjectEditRef.current?.focus()
    }, [editingSubject])

    useEffect(() => {
        if (editingMaterial !== null) materialEditRef.current?.focus()
    }, [editingMaterial])

    useEffect(() => {
        if (editingSubCat !== null) subCatEditRef.current?.focus()
    }, [editingSubCat])

    const handleLogout = async () => {
        await apiLogout().catch(() => {})
        clearAuth()
        navigate('/login')
    }

    // ── Subject handlers ─────────────────────────────────────────────────────
    const startEditSubject = (name: string) => {
        setEditingSubject(name)
        setEditingSubjectValue(name)
        setSubjectError(null)
    }
    const cancelEditSubject = () => { setEditingSubject(null); setEditingSubjectValue('') }

    const handleSubjectRenameSave = async () => {
        const newName = editingSubjectValue.trim()
        if (!editingSubject || !newName) return
        if (newName === editingSubject) { cancelEditSubject(); return }
        setSubjectLoading(true)
        setSubjectError(null)
        try {
            await renameSubject(editingSubject, newName)
            setSubjects(subjects.map((s) => (s === editingSubject ? newName : s)))
            // 小分類の所属科目名も一括更新（クライアント側のみ）
            setSubCategories(subCategories.map(sc => sc.subject === editingSubject ? { ...sc, subject: newName } : sc))
            setEditingSubject(null)
        } catch (e) {
            setSubjectError(e instanceof Error ? e.message : '変更に失敗しました')
        } finally {
            setSubjectLoading(false)
        }
    }

    const handleSubjectDeleteConfirm = async () => {
        if (!deleteSubjectTarget) return
        setSubjectLoading(true)
        setSubjectError(null)
        try {
            await deleteSubject(deleteSubjectTarget)
            setSubjects(subjects.filter((s) => s !== deleteSubjectTarget))
            setSubCategories(subCategories.filter((sc) => sc.subject !== deleteSubjectTarget))
            setDeleteSubjectTarget(null)
        } catch (e) {
            setSubjectError(e instanceof Error ? e.message : '削除に失敗しました')
        } finally {
            setSubjectLoading(false)
        }
    }

    // ── Material handlers ────────────────────────────────────────────────────
    const startEditMaterial = (name: string) => {
        setEditingMaterial(name)
        setEditingMaterialValue(name)
        setMaterialError(null)
    }
    const cancelEditMaterial = () => { setEditingMaterial(null); setEditingMaterialValue('') }

    const handleMaterialRenameSave = async () => {
        const newName = editingMaterialValue.trim()
        if (!editingMaterial || !newName) return
        if (newName === editingMaterial) { cancelEditMaterial(); return }
        setMaterialLoading(true)
        setMaterialError(null)
        try {
            await renameMaterial(editingMaterial, newName)
            setMaterials(materials.map((m) => (m === editingMaterial ? newName : m)))
            setEditingMaterial(null)
        } catch (e) {
            setMaterialError(e instanceof Error ? e.message : '変更に失敗しました')
        } finally {
            setMaterialLoading(false)
        }
    }

    const handleMaterialDeleteConfirm = async () => {
        if (!deleteMaterialTarget) return
        setMaterialLoading(true)
        setMaterialError(null)
        try {
            await deleteMaterial(deleteMaterialTarget)
            setMaterials(materials.filter((m) => m !== deleteMaterialTarget))
            setDeleteMaterialTarget(null)
        } catch (e) {
            setMaterialError(e instanceof Error ? e.message : '削除に失敗しました')
        } finally {
            setMaterialLoading(false)
        }
    }

    // ── SubCategory handlers ─────────────────────────────────────────────────
    const startEditSubCat = (sc: SubCategory) => {
        setEditingSubCat(sc.id)
        setEditingSubCatValue(sc.name)
        setSubCatError(null)
    }
    const cancelEditSubCat = () => { setEditingSubCat(null); setEditingSubCatValue('') }

    const handleSubCatRenameSave = async () => {
        const newName = editingSubCatValue.trim()
        const target = subCategories.find((sc) => sc.id === editingSubCat)
        if (!target || !newName) return
        if (newName === target.name) { cancelEditSubCat(); return }
        setSubCatLoading(true)
        setSubCatError(null)
        try {
            const updated = await updateSubCategory(target.id, { subject: target.subject, name: newName })
            setSubCategories(subCategories.map((sc) => (sc.id === updated.id ? updated : sc)))
            setEditingSubCat(null)
        } catch (e) {
            setSubCatError(e instanceof Error ? e.message : '変更に失敗しました')
        } finally {
            setSubCatLoading(false)
        }
    }

    const handleSubCatDeleteConfirm = async () => {
        if (!deleteSubCatTarget) return
        setSubCatLoading(true)
        setSubCatError(null)
        try {
            await deleteSubCategory(deleteSubCatTarget.id)
            setSubCategories(subCategories.filter((sc) => sc.id !== deleteSubCatTarget.id))
            setDeleteSubCatTarget(null)
        } catch (e) {
            setSubCatError(e instanceof Error ? e.message : '削除に失敗しました')
        } finally {
            setSubCatLoading(false)
        }
    }

    // ── Alert settings handler ───────────────────────────────────────────────
    const handleAlertSave = async () => {
        if (alertThreshold < 1) return
        setAlertLoading(true)
        setAlertError(null)
        setAlertSaved(false)
        try {
            const saved = await updateAlertSettings({ thresholdDays: alertThreshold, includeUntouched: alertIncludeUntouched })
            setAlertSettings(saved)
            setAlertSaved(true)
            setTimeout(() => setAlertSaved(false), 2000)
        } catch (e) {
            setAlertError(e instanceof Error ? e.message : '保存に失敗しました')
        } finally {
            setAlertLoading(false)
        }
    }

    if (!user) return null

    const initial = user.name?.charAt(0).toUpperCase() ?? '?'

    return (
        <div style={pageWrapper}>
            <div style={content}>
                <h1 style={heading}>プロフィール</h1>

                <div style={avatarWrap}>
                    <div style={avatar}>{initial}</div>
                </div>

                <div style={card}>
                    <div style={row}>
                        <span style={label}>名前</span>
                        <span style={value}>{user.name}</span>
                    </div>
                    <div style={divider} />
                    <div style={row}>
                        <span style={label}>メールアドレス</span>
                        <span style={value}>{user.email}</span>
                    </div>
                </div>

                {/* アプリ設定 */}
                <div style={sectionHeadingWrap}>
                    <span style={sectionHeading}>アプリ設定</span>
                </div>

                {/* 学習体系管理（科目・小分類を一括管理） */}
                <div style={settingsBlock}>
                    <p style={settingsSubLabel}>学習体系管理</p>
                    <p style={settingsNote}>科目を削除すると、紐づく全てのデータが削除されます。小分類の削除は記録のタグ付けのみ解除されます。</p>

                    {(subjectError || subCatError) && <p style={errorText}>{subjectError || subCatError}</p>}

                    <div style={itemList}>
                        {subjects.map((subjectName) => {
                            const items = subCategories.filter((sc) => sc.subject === subjectName)

                            return (
                                <div key={subjectName} style={subjectContainer}>
                                    {/* 科目行 */}
                                    {editingSubject === subjectName ? (
                                        <div style={editRow}>
                                            <input
                                                ref={subjectEditRef}
                                                value={editingSubjectValue}
                                                onChange={(e) => setEditingSubjectValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSubjectRenameSave()
                                                    if (e.key === 'Escape') cancelEditSubject()
                                                }}
                                                style={editInput}
                                                disabled={subjectLoading}
                                            />
                                            <button onClick={handleSubjectRenameSave} disabled={subjectLoading || !editingSubjectValue.trim()} style={saveBtn}>保存</button>
                                            <button onClick={cancelEditSubject} disabled={subjectLoading} style={cancelBtn}>キャンセル</button>
                                        </div>
                                    ) : deleteSubjectTarget === subjectName ? (
                                        <div style={deleteConfirmRow}>
                                            <span style={deleteConfirmText}>「{subjectName}」の全データを削除しますか？</span>
                                            <button onClick={handleSubjectDeleteConfirm} disabled={subjectLoading} style={destructiveBtn}>削除</button>
                                            <button onClick={() => setDeleteSubjectTarget(null)} disabled={subjectLoading} style={cancelBtn}>中止</button>
                                        </div>
                                    ) : (
                                        <div style={itemRow}>
                                            <span style={itemName}>{subjectName}</span>
                                            <div style={itemActions}>
                                                <button onClick={() => startEditSubject(subjectName)} style={iconBtn}>編集</button>
                                                <button onClick={() => setDeleteSubjectTarget(subjectName)} style={{ ...iconBtn, color: c.red }}>削除</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 小分類リスト（インデント表示） */}
                                    <div style={subCatList}>
                                        {items.map((sc) => (
                                            <div key={sc.id} style={subCatRowContainer}>
                                                {editingSubCat === sc.id ? (
                                                    <div style={editRow}>
                                                        <input
                                                            ref={subCatEditRef}
                                                            value={editingSubCatValue}
                                                            onChange={(e) => setEditingSubCatValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSubCatRenameSave()
                                                                if (e.key === 'Escape') cancelEditSubCat()
                                                            }}
                                                            style={{ ...editInput, fontSize: '13px' }}
                                                            disabled={subCatLoading}
                                                        />
                                                        <button onClick={handleSubCatRenameSave} style={saveBtn}>保存</button>
                                                        <button onClick={cancelEditSubCat} style={cancelBtn}>×</button>
                                                    </div>
                                                ) : deleteSubCatTarget?.id === sc.id ? (
                                                    <div style={deleteConfirmRow}>
                                                        <span style={{ ...deleteConfirmText, fontSize: '11px' }}>削除？</span>
                                                        <button onClick={handleSubCatDeleteConfirm} style={destructiveBtn}>OK</button>
                                                        <button onClick={() => setDeleteSubCatTarget(null)} style={cancelBtn}>×</button>
                                                    </div>
                                                ) : (
                                                    <div style={subCatRow}>
                                                        <div style={subCatNameGroup}>
                                                            <div style={subCatDot} />
                                                            <span style={subCatName}>{sc.name}</span>
                                                        </div>
                                                        <div style={itemActions}>
                                                            <button onClick={() => startEditSubCat(sc)} style={subIconBtn}>編集</button>
                                                            <button onClick={() => setDeleteSubCatTarget(sc)} style={{ ...subIconBtn, color: c.red }}>削除</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {items.length === 0 && <p style={subEmptyText}>小分類なし</p>}
                                    </div>
                                    <div style={subjectDivider} />
                                </div>
                            )
                        })}
                        {subjects.length === 0 && <p style={emptyText}>科目が登録されていません</p>}
                    </div>
                </div>

                {/* 教材管理 */}
                <div style={settingsBlock}>
                    <p style={settingsSubLabel}>教材管理</p>
                    <p style={settingsNote}>教材を削除すると、記録の教材フィールドが空になります。</p>

                    {materialError && <p style={errorText}>{materialError}</p>}

                    <div style={itemList}>
                        {materials.map((name) => (
                            <div key={name}>
                                {editingMaterial === name ? (
                                    <div style={editRow}>
                                        <input
                                            ref={materialEditRef}
                                            value={editingMaterialValue}
                                            onChange={(e) => setEditingMaterialValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleMaterialRenameSave()
                                                if (e.key === 'Escape') cancelEditMaterial()
                                            }}
                                            style={editInput}
                                            disabled={materialLoading}
                                        />
                                        <button onClick={handleMaterialRenameSave} disabled={materialLoading || !editingMaterialValue.trim()} style={saveBtn}>保存</button>
                                        <button onClick={cancelEditMaterial} disabled={materialLoading} style={cancelBtn}>キャンセル</button>
                                    </div>
                                ) : deleteMaterialTarget === name ? (
                                    <div style={deleteConfirmRow}>
                                        <span style={deleteConfirmText}>「{name}」を削除しますか？</span>
                                        <button onClick={handleMaterialDeleteConfirm} disabled={materialLoading} style={destructiveBtn}>削除</button>
                                        <button onClick={() => setDeleteMaterialTarget(null)} disabled={materialLoading} style={cancelBtn}>キャンセル</button>
                                    </div>
                                ) : (
                                    <div style={itemRow}>
                                        <span style={itemName}>{name}</span>
                                        <div style={itemActions}>
                                            <button onClick={() => startEditMaterial(name)} style={iconBtn}>編集</button>
                                            <button onClick={() => setDeleteMaterialTarget(name)} style={{ ...iconBtn, color: c.red }}>削除</button>
                                        </div>
                                    </div>
                                )}
                                <div style={divider} />
                            </div>
                        ))}
                        {materials.length === 0 && <p style={emptyText}>教材が登録されていません</p>}
                    </div>
                </div>

                {/* アラート設定 */}
                <div style={settingsBlock}>
                    <p style={settingsSubLabel}>アラート設定</p>
                    <p style={settingsNote}>ダッシュボードに表示する「学習の滞り」アラートの基準を設定します。</p>

                    {alertError && <p style={errorText}>{alertError}</p>}

                    <div style={alertForm}>
                        <div style={alertField}>
                            <label style={alertLabel}>警告する滞り日数</label>
                            <div style={alertInputRow}>
                                <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={alertThreshold}
                                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                                    style={numberInput}
                                    disabled={alertLoading}
                                />
                                <span style={alertUnit}>日以上</span>
                            </div>
                        </div>
                        <div style={alertField}>
                            <label style={alertCheckboxRow}>
                                <input
                                    type="checkbox"
                                    checked={alertIncludeUntouched}
                                    onChange={(e) => setAlertIncludeUntouched(e.target.checked)}
                                    disabled={alertLoading}
                                    style={{ marginRight: '8px' }}
                                />
                                <span style={alertLabel}>未学習の科目も対象にする</span>
                            </label>
                        </div>
                        <div style={alertSaveRow}>
                            <button onClick={handleAlertSave} disabled={alertLoading || alertThreshold < 1} style={saveBtn}>
                                {alertLoading ? '保存中...' : '保存'}
                            </button>
                            {alertSaved && <span style={savedText}>保存しました</span>}
                        </div>
                    </div>
                </div>

                <button style={logoutBtn} onClick={handleLogout}>
                    ログアウト
                </button>
            </div>
        </div>
    )
}

// ── Styles ──────────────────────────────────────────────────────────────

const pageWrapper: React.CSSProperties = { backgroundColor: c.bg, minHeight: '100vh', color: c.text }
const content: React.CSSProperties = { maxWidth: '480px', margin: '0 auto', padding: '48px 20px 120px' }
const heading: React.CSSProperties = { fontSize: '20px', fontWeight: 700, marginBottom: '32px', letterSpacing: '-0.01em' }
const avatarWrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', marginBottom: '32px' }
const avatar: React.CSSProperties = {
    width: '72px', height: '72px', borderRadius: '50%',
    backgroundColor: '#2383e2', color: '#fff',
    fontSize: '28px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const card: React.CSSProperties = { border: `1px solid rgba(55, 53, 47, 0.09)`, borderRadius: '8px', overflow: 'hidden', marginBottom: '32px' }
const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px' }
const divider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55, 53, 47, 0.06)' }
const label: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }
const value: React.CSSProperties = { fontSize: font.base, color: c.text, fontWeight: 500 }

const sectionHeadingWrap: React.CSSProperties = { marginBottom: '12px' }
const sectionHeading: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }

const settingsBlock: React.CSSProperties = {
    border: `1px solid rgba(55, 53, 47, 0.09)`, borderRadius: '8px',
    padding: '16px 20px', marginBottom: '16px',
}
const settingsSubLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: c.text }
const settingsNote: React.CSSProperties = { fontSize: '11px', color: 'rgba(55, 53, 47, 0.45)', marginBottom: '16px', lineHeight: 1.6 }
const errorText: React.CSSProperties = { fontSize: '12px', color: c.red, marginBottom: '12px' }

const itemList: React.CSSProperties = { display: 'flex', flexDirection: 'column' }

// 科目・小分類の構造化スタイル
const subjectContainer: React.CSSProperties = { marginBottom: '8px' }
const subCatList: React.CSSProperties = { marginLeft: '20px', borderLeft: `2px solid rgba(55, 53, 47, 0.06)`, paddingLeft: '12px' }
const subCatRowContainer: React.CSSProperties = { padding: '4px 0' }
const subCatRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const subCatNameGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }
const subCatDot: React.CSSProperties = { width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgba(55, 53, 47, 0.2)' }
const subCatName: React.CSSProperties = { fontSize: '13px', color: 'rgba(55, 53, 47, 0.7)', fontWeight: 500 }
const subjectDivider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55, 53, 47, 0.04)', marginTop: '8px' }
const subEmptyText: React.CSSProperties = { fontSize: '11px', color: 'rgba(55, 53, 47, 0.25)', fontStyle: 'italic', padding: '4px 0' }

const itemRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 0',
}
const itemName: React.CSSProperties = { fontSize: font.base, fontWeight: 600, color: c.text }
const itemActions: React.CSSProperties = { display: 'flex', gap: '8px' }
const iconBtn: React.CSSProperties = {
    background: 'none', border: 'none',
    fontSize: '12px', fontWeight: 600,
    color: 'rgba(55, 53, 47, 0.45)', cursor: 'pointer', padding: '2px 6px',
}
const subIconBtn: React.CSSProperties = {
    ...iconBtn, fontSize: '11px', padding: '2px 4px'
}

const editRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0',
}
const editInput: React.CSSProperties = {
    flex: 1, border: `1px solid rgba(55, 53, 47, 0.2)`, borderRadius: '4px',
    padding: '6px 8px', fontSize: font.base, color: c.text, outline: 'none',
    backgroundColor: 'rgba(55, 53, 47, 0.02)',
}

const deleteConfirmRow: React.CSSProperties = {
    display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: '8px', padding: '8px 0',
}
const deleteConfirmText: React.CSSProperties = {
    flex: 1, fontSize: '12px', color: c.red, fontWeight: 500,
}

const saveBtn: React.CSSProperties = {
    padding: '4px 10px', backgroundColor: '#2383e2', color: '#fff',
    border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
}
const cancelBtn: React.CSSProperties = {
    padding: '4px 10px', backgroundColor: 'transparent',
    border: `1px solid rgba(55, 53, 47, 0.16)`, borderRadius: '4px',
    fontSize: '11px', color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer', fontWeight: 500,
}
const destructiveBtn: React.CSSProperties = {
    padding: '4px 10px', backgroundColor: c.red, color: '#fff',
    border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
}

const emptyText: React.CSSProperties = { fontSize: font.base, color: 'rgba(55, 53, 47, 0.35)', padding: '12px 0' }

const alertForm: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' }
const alertField: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' }
const alertLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: c.text }
const alertInputRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }
const alertCheckboxRow: React.CSSProperties = { display: 'flex', alignItems: 'center', cursor: 'pointer' }
const alertUnit: React.CSSProperties = { fontSize: font.sm, color: 'rgba(55, 53, 47, 0.6)' }
const alertSaveRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const savedText: React.CSSProperties = { fontSize: '12px', color: '#0f9d58', fontWeight: 500 }
const numberInput: React.CSSProperties = {
    width: '64px', border: `1px solid rgba(55, 53, 47, 0.2)`, borderRadius: '4px',
    padding: '6px 8px', fontSize: font.base, color: c.text, outline: 'none',
    backgroundColor: 'rgba(55, 53, 47, 0.02)', textAlign: 'center',
}

const logoutBtn: React.CSSProperties = {
    width: '100%', padding: '12px', backgroundColor: 'transparent',
    border: `1px solid rgba(55, 53, 47, 0.16)`, borderRadius: '6px',
    fontSize: font.sm, color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer', fontWeight: 500,
    marginTop: '16px',
}