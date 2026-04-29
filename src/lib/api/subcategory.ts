
// GET /api/sub-categories?subject=
import {apiFetch} from "../client";
import type {SubCategory, SubCategoryInput} from "../../types/workspace";

export async function fetchSubCategories(subject?: string): Promise<SubCategory[]> {
  const url = subject
    ? `/api/sub-categories?subject=${encodeURIComponent(subject)}`
    : '/api/sub-categories'
  const res = await apiFetch(url)
  if (!res.ok) throw new Error('小分類の取得に失敗しました')
  return res.json()
}

// POST /api/sub-categories
export async function addSubCategory(input: SubCategoryInput): Promise<SubCategory> {
  const res = await apiFetch('/api/sub-categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('小分類の追加に失敗しました')
  return res.json()
}

// PUT /api/sub-categories/:id
export async function updateSubCategory(id: number, input: SubCategoryInput): Promise<SubCategory> {
  const res = await apiFetch(`/api/sub-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('小分類の更新に失敗しました')
  return res.json()
}

// DELETE /api/sub-categories/:id
export async function deleteSubCategory(id: number): Promise<void> {
  const res = await apiFetch(`/api/sub-categories/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('小分類の削除に失敗しました')
}
