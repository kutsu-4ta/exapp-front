export type AdviceMode = 'ANALYSIS' | 'INSPIRATION' | 'ANALOGY' | 'WARNING'

export const ADVICE_MODES: { value: AdviceMode; label: string; icon: string }[] = [
  { value: 'ANALYSIS', label: '進捗分析', icon: '📊' },
  { value: 'INSPIRATION', label: 'メンタル', icon: '🥺' },
  { value: 'ANALOGY', label: '息抜き', icon: '💡' },
  { value: 'WARNING', label: 'マジレス', icon: '👿' },
]
