import { useState } from 'react';
import type { AdviceMode } from "@/types/aiAgent.ts";
import { ADVICE_MODES } from "@/types/aiAgent.ts";

type Props = {
    onGetAdvice: (mode: AdviceMode) => Promise<string>;
};

export function AIAgentWidget({ onGetAdvice }: Props) {
    const [selectedMode, setSelectedMode] = useState<AdviceMode>('ANALYSIS');
    const [advice, setAdvice] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRequest = async () => {
        setLoading(true);
        try {
            const result = await onGetAdvice(selectedMode);
            setAdvice(result);
        } catch (e) {
            console.error("Advice API Error:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={container}>
            <div style={controls}>
                <div style={selectWrapper}>
                    <select
                        value={selectedMode}
                        onChange={(e) => setSelectedMode(e.target.value as AdviceMode)}
                        style={notionSelect}
                    >
                        {ADVICE_MODES.map(m => (
                            <option key={m.value} value={m.value}>
                                {m.icon} {m.label}
                            </option>
                        ))}
                    </select>
                    {/* カスタム矢印を追加してNotionらしさを強調 */}
                    <div style={selectArrow}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                </div>
                <button
                    onClick={handleRequest}
                    disabled={loading}
                    style={loading ? {...notionAdviceBtn, opacity: 0.6} : notionAdviceBtn}
                >
                    <span style={{ fontSize: '14px' }}>✨</span>
                    <span style={{ marginLeft: '4px' }}>{loading ? '...' : '聞く'}</span>
                </button>
            </div>

            {/* advice表示部分は変更なし */}
        </div>
    );
}

const controls: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    gap: '6px',
    height: '34px', // 少しだけ高さを抑えてシュッとさせました
    alignItems: 'stretch',
};

const selectWrapper: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: 'fit-content', // 中身（テキスト）に合わせる
    minWidth: '110px',   // 「進捗分析」が切れない最小幅
};

const notionSelect: React.CSSProperties = {
    width: '100%',
    height: '100%',
    fontSize: '13px',
    fontWeight: 500,
    padding: '0 24px 0 8px', // 右側に矢印用の余白を確保
    borderRadius: '6px',
    border: '1px solid rgba(55, 53, 47, 0.12)',
    background: 'rgba(55, 53, 47, 0.04)',
    color: '#37352f',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
};

const selectArrow: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    color: 'rgba(55, 53, 47, 0.35)',
};

const notionAdviceBtn: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    padding: '0 12px',
    borderRadius: '6px',
    border: '1px solid rgba(55, 53, 47, 0.12)',
    background: '#ffffff',
    color: '#37352f',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
};
const container: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
};