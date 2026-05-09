const cache = new Map<string, { data: unknown; ts: number }>()
const TTL = 5 * 60 * 1000

export function getCached<T>(key: string): T | null {
    const entry = cache.get(key)
    if (!entry || Date.now() - entry.ts > TTL) {
        cache.delete(key)
        return null
    }
    return entry.data as T
}

export function setCached<T>(key: string, data: T): void {
    cache.set(key, { data, ts: Date.now() })
}

export function invalidateCache(...keys: string[]): void {
    keys.forEach((k) => cache.delete(k))
}
