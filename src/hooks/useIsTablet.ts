import {useEffect, useState} from 'react'

/** iPad などタッチ操作の中・大画面デバイスを検出する */
const QUERY = '(pointer: coarse) and (min-width: 768px)'

export function useIsTablet(): boolean {
  const [tablet, setTablet] = useState(() => window.matchMedia(QUERY).matches)
  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setTablet(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return tablet
}
