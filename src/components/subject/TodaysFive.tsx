import type {CSSProperties} from "react";
import {useEffect, useState} from "react";
import type {Flashcard} from "@/types/workspace.ts";
import {fetchFlashcards} from "@/lib/api/subjects.ts";
import {c} from "@/styles/notion.ts";
import {subjectUi} from "@/styles/subjectUI.ts";

export function TodaysFive({
                              subjectName,
                              navigate,
                          }: {
    subjectName: string;
    navigate: any;
}) {
    const [todayCards, setTodayCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);

    // 習熟度に応じた色定義
    const PROF_COLORS: Record<string, string> = {
        '○': '#27ae60',
        '△': '#f2ab26',
        '×': '#eb5757',
    };

    useEffect(() => {
        setLoading(true);
        fetchFlashcards(subjectName, 5)
            .then(setTodayCards)
            .finally(() => setLoading(false));
    }, [subjectName]);

    return (
        <div style={subjectUi.subContainer}>
            <div style={subjectUi.sectionHeadingWrap}>
                <span style={subjectUi.sectionHeading}>TODAY'S FIVE</span>
            </div>

            {loading ? (
                <p style={todaysFiveUi.loadingText}>読み込み中...</p>
            ) : todayCards.length === 0 ? (
                <p style={todaysFiveUi.emptyText}>ノートがありません</p>
            ) : (
                <div style={todaysFiveUi.block}>
                    {todayCards.map((card, i) => (
                        <div key={card.id}>
                            <div style={todaysFiveUi.row}>
                <span
                    style={{
                        ...todaysFiveUi.proficiency,
                        color: PROF_COLORS[card.back.proficiency] ?? c.text,
                    }}
                >
                  {card.back.proficiency}
                </span>
                                <span style={todaysFiveUi.cardRef}>
                  {card.front.material} {card.front.questionRef}
                </span>
                                {card.front.subCategory && (
                                    <span style={todaysFiveUi.subCategoryTag}>
                    {card.front.subCategory}
                  </span>
                                )}
                            </div>
                            {i < todayCards.length - 1 && <div style={todaysFiveUi.divider} />}
                        </div>
                    ))}

                    <button
                        style={todaysFiveUi.startButton}
                        onClick={() =>
                            navigate(`/practice/${encodeURIComponent(subjectName)}`, {
                                state: { todayCards, mode: 'today' },
                            })
                        }
                    >
                        演習を開始
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            style={{ marginLeft: '6px' }}
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Styles ──────────────────────────────────────────────────────────

const todaysFiveUi = {
    block: {
        border: `1px solid rgba(55, 53, 47, 0.08)`,
        borderRadius: '10px',
        padding: '12px 20px',
        backgroundColor: '#fff',
    } as CSSProperties,

    row: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 0',
    } as CSSProperties,

    proficiency: {
        fontSize: '15px',
        fontWeight: 700,
    } as CSSProperties,

    cardRef: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#37352f', // c.text
        flex: 1,
    } as CSSProperties,

    subCategoryTag: {
        fontSize: '11px',
        color: 'rgba(55,53,47,0.4)',
        backgroundColor: 'rgba(55,53,47,0.05)',
        borderRadius: '4px',
        padding: '2px 6px',
        flexShrink: 0,
    } as CSSProperties,

    divider: {
        height: '1px',
        backgroundColor: 'rgba(55, 53, 47, 0.05)',
        margin: '0',
    } as CSSProperties,

    startButton: {
        width: '100%',
        marginTop: '12px',
        padding: '12px',
        backgroundColor: '#37352f', // c.text
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    loadingText: {
        fontSize: '12px',
        color: 'rgba(55,53,47,0.3)',
        padding: '12px 0',
    } as CSSProperties,

    emptyText: {
        fontSize: '13px',
        color: 'rgba(55, 53, 47, 0.3)',
        padding: '16px 0',
        textAlign: 'center',
    } as CSSProperties,
};