import {ANSWER_OPTIONS} from '../../types/exam'
import {DoubtIcon} from '@/lib/icon/DoubtIcon.tsx'
import {c} from '@/styles/notion.ts'
import {
    answerGroup,
    descriptiveTextarea,
    doubtBtnInline,
    doubtRow,
    excludeBtn,
    excludeBtnActive,
    generalMemoTextarea,
    optionActive,
    optionBtn,
    optionExcluded,
    optionLineRow,
    optionMemoInput,
    optionRightGroup,
} from './QuestionRow.styles'

const ALPHABET_OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const

export interface AnswerInputPanelProps {
    isDescriptive: boolean
    isAlphabet: boolean
    selectedOption: string
    excludedOptions: string[]
    memos: Record<string, string>
    isDoubtful: boolean
    generalMemo: string
    descriptiveText: string
    onSelectOption: (opt: string) => void
    onToggleExclude: (opt: string) => void
    onUpdateMemo: (opt: string, text: string) => void
    onToggleDoubtful: () => void
    onUpdateGeneralMemo: (text: string) => void
    onUpdateDescriptiveText: (text: string) => void
    onFocus?: (el: HTMLElement | null) => void
    generalMemoPlaceholder?: string
}

export function AnswerInputPanel({
    isDescriptive,
    isAlphabet,
    selectedOption,
    excludedOptions,
    memos,
    isDoubtful,
    generalMemo,
    descriptiveText,
    onSelectOption,
    onToggleExclude,
    onUpdateMemo,
    onToggleDoubtful,
    onUpdateGeneralMemo,
    onUpdateDescriptiveText,
    onFocus,
    generalMemoPlaceholder = 'メモ',
}: AnswerInputPanelProps) {
    const handleFocus = (el: HTMLElement | null) => onFocus?.(el)

    if (isDescriptive) {
        return (
            <div style={answerGroup}>
                <div style={doubtRow}>
                    <button type="button" onClick={onToggleDoubtful} style={doubtBtnInline}>
                        <DoubtIcon size={18} color={isDoubtful ? '#f2994a' : c.textFaint} />
                    </button>
                    <textarea
                        style={{ ...descriptiveTextarea, fontSize: 16, touchAction: 'manipulation' }}
                        rows={2}
                        placeholder="解答を記述..."
                        value={descriptiveText}
                        onFocus={(e) => handleFocus(e.currentTarget)}
                        onChange={(e) => {
                            onUpdateDescriptiveText(e.target.value)
                            e.target.style.height = 'auto'
                            e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div style={answerGroup}>
            {isAlphabet ? (
                <>
                    {/* 回答ボタン（ア〜オ）横並び */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {ANSWER_OPTIONS.map((opt) => {
                            const isSelected = selectedOption === opt
                            const isExcluded = excludedOptions.includes(opt)
                            return (
                                <button
                                    key={`ans-${opt}`}
                                    type="button"
                                    style={{
                                        ...optionBtn,
                                        ...(isSelected ? optionActive : {}),
                                        ...(isExcluded && !isSelected ? optionExcluded : {}),
                                    }}
                                    onClick={() => onSelectOption(isSelected ? '' : opt)}
                                >
                                    <span>{opt}</span>
                                </button>
                            )
                        })}
                    </div>
                    {/* A〜E 消去法メモ行 */}
                    {ALPHABET_OPTIONS.map((alpha) => {
                        const isExcluded = excludedOptions.includes(alpha)
                        return (
                            <div
                                key={`alpha-row-${alpha}`}
                                style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
                            >
                                <button
                                    type="button"
                                    style={{
                                        ...optionBtn,
                                        ...excludeBtn,
                                        ...(isExcluded ? excludeBtnActive : {}),
                                        marginRight: '10px',
                                        minWidth: '40px',
                                    }}
                                    onClick={() => onToggleExclude(alpha)}
                                >
                                    <span style={isExcluded ? { textDecoration: 'line-through' } : {}}>
                                        {alpha}
                                    </span>
                                </button>
                                <div style={optionRightGroup}>
                                    <input
                                        type="text"
                                        style={{ ...optionMemoInput, fontSize: 16 }}
                                        placeholder={`${alpha}のメモ`}
                                        value={memos[alpha] ?? ''}
                                        onFocus={(e) => handleFocus(e.currentTarget)}
                                        onChange={(e) => onUpdateMemo(alpha, e.target.value)}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </>
            ) : (
                ANSWER_OPTIONS.map((opt) => {
                    const isSelected = selectedOption === opt
                    const isExcluded = excludedOptions.includes(opt)
                    return (
                        <div key={opt} style={optionLineRow}>
                            <button
                                type="button"
                                style={{
                                    ...optionBtn,
                                    ...(isSelected ? optionActive : {}),
                                    ...(isExcluded && !isSelected ? optionExcluded : {}),
                                    marginRight: '10px',
                                }}
                                onClick={() => onSelectOption(isSelected ? '' : opt)}
                            >
                                <span style={isExcluded && !isSelected ? { textDecoration: 'line-through' } : {}}>
                                    {opt}
                                </span>
                            </button>
                            <div style={optionRightGroup}>
                                <button
                                    type="button"
                                    style={{
                                        ...excludeBtn,
                                        ...(isExcluded ? excludeBtnActive : {}),
                                    }}
                                    onClick={() => onToggleExclude(opt)}
                                    title="消去法"
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                        <line
                                            x1="2"
                                            y1="2"
                                            x2="12"
                                            y2="12"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    style={{ ...optionMemoInput, fontSize: 16 }}
                                    placeholder={`${opt}のメモ`}
                                    value={memos[opt] ?? ''}
                                    onFocus={(e) => handleFocus(e.currentTarget)}
                                    onChange={(e) => onUpdateMemo(opt, e.target.value)}
                                />
                            </div>
                        </div>
                    )
                })
            )}

            {/* 疑問フラグ + 共通メモ */}
            <div style={doubtRow}>
                <button type="button" onClick={onToggleDoubtful} style={doubtBtnInline}>
                    <DoubtIcon size={18} color={isDoubtful ? '#f2994a' : c.textFaint} />
                </button>
                <textarea
                    style={{ ...generalMemoTextarea, fontSize: 16 }}
                    placeholder={generalMemoPlaceholder}
                    value={generalMemo}
                    onFocus={(e) => handleFocus(e.currentTarget)}
                    onChange={(e) => onUpdateGeneralMemo(e.target.value)}
                />
            </div>
        </div>
    )
}
