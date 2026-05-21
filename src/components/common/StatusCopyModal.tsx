type Props = {
  text: string
  copied: boolean
  onCopy: () => void
  onClose: () => void
}

export function StatusCopyModal({ text, copied, onCopy, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[1500] bg-[rgba(0,0,0,0.45)] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[600px] rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(55,53,47,0.08)]">
          <span className="text-[14px] font-bold text-n-text">ステータスプレビュー</span>
          <button
            onClick={onClose}
            className="text-[rgba(55,53,47,0.3)] border-none bg-transparent cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <textarea
            readOnly
            className="w-full h-[40vh] p-3 text-[13px] font-mono leading-relaxed bg-[rgba(55,53,47,0.02)] border border-[rgba(55,53,47,0.08)] rounded-lg outline-none resize-none text-n-text"
            value={text}
          />
        </div>

        <div className="p-5 pt-0">
          <button
            onClick={onCopy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-n-blue text-white text-[14px] font-bold border-none cursor-pointer transition-opacity active:opacity-80"
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                コピー完了
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="4" rx="1" />
                  <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                </svg>
                クリップボードにコピー
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
