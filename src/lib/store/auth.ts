import {create} from 'zustand'
import {persist} from 'zustand/middleware'

export type AuthUser = {
    id: number
    name: string
    email: string
    nickname: string | null
    occupation: string | null
    goal: string | null
    weakAreas: string | null
    strongAreas: string | null
    interests: string | null
    geminiTokenSet: string | null // セキュリティ上、直接は入れない
}

interface AuthState {
    user: AuthUser | null
    token: string | null
    setAuth: (user: AuthUser, token: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            nickname: null,
            occupation: null,
            goal: null,
            weakAreas: null,
            strongAreas: null,
            interests: null,
            geminiTokenSet: null,
            setAuth: (user, token) => set({user, token}),
            logout: () => set({user: null, token: null}),
        }),
        {
            name: 'exapp-auth-storage',
        }
    )
)
