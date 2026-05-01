export type AdviceMode = 'ANALYSIS' | 'INSPIRATION' | 'ANALOGY' | 'INSIGHT';

export const ADVICE_MODES: { value: AdviceMode; label: string; icon: string }[] = [
    { value: 'ANALYSIS', label: '進捗分析', icon: '📊' },
    { value: 'INSPIRATION', label: 'モチベ向上', icon: '🔥' },
    { value: 'ANALOGY', label: '趣味と連結', icon: '⚛️' },
    { value: 'INSIGHT', label: '実務・雑学', icon: '💡' },
];