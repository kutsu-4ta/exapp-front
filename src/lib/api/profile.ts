import {apiFetch, extractApiError} from '../client'

export type UserProfile = {
  nickname: string | null
  occupation: string | null
  goal: string | null
  weakAreas: string | null
  strongAreas: string | null
  interests: string | null
  geminiTokenSet: boolean
}

export type UserProfileInput = {
  nickname?: string | null
  occupation?: string | null
  goal?: string | null
  weakAreas?: string | null
  strongAreas?: string | null
  interests?: string | null
  geminiToken?: string | null
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await apiFetch('/api/profile')
  if (!res.ok) await extractApiError(res, 'プロフィールの取得に失敗しました')
  return res.json()
}

export async function updateUserProfile(input: UserProfileInput): Promise<UserProfile> {
  const res = await apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'プロフィールの更新に失敗しました')
  }
  return res.json()
}
