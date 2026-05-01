import {daysAgo} from "../../types/workspace";
import {c, font, sectionLabelStyle, triangleStyle} from "../../styles/notion";
import {useNavigate} from "react-router-dom";

type SubjectResponse = { subject: string; lastDate: string | null };

type SubjectEntry = { subject: string; lastDate: string | null };

type Props = {
    subjectTouched: SubjectResponse[]
};

export function SubjectStatus({ subjectTouched }: Props) {
    const navigate = useNavigate();

    return (
        <section style={section}>
            <div style={sectionLabelStyle}>
                <span style={triangleStyle}>▼</span> SUBJECT STATUS
            </div>
            <div style={list}>
                {subjectTouched.map((item) => {
                    const entry: SubjectEntry = {
                        subject: item.subject,
                        lastDate: item.lastDate,
                    };

                    const label = getStatusLabel(entry.lastDate);

                    return (
                        <div
                            key={entry.subject}
                            style={row}
                            onClick={() => navigate(`/subjects/${encodeURIComponent(entry.subject)}`)}
                        >
                            <div style={nameGroup}>
                                <BookIcon />
                                <span style={subjectText}>{entry.subject}</span>
                            </div>
                            <div style={rightGroup}>
                                <span
                                    style={{
                                        ...tagBase,
                                        color: label.color,
                                        backgroundColor: label.bg,
                                    }}
                                >
                                    {label.text}
                                </span>
                                <ChevronIcon />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function getStatusLabel(lastDate: string | null) {
    if (!lastDate) {
        return { text: "未学習", color: "#8a7b6e", bg: "rgba(55, 53, 47, 0.08)" };
    }

    const n = daysAgo(lastDate);

    if (n === 0) return { text: "今日", color: "#3a7a2a", bg: "rgba(58, 122, 42, 0.1)" };
    if (n === 1) return { text: "昨日", color: "#5c3a1e", bg: "rgba(92, 58, 30, 0.1)" };
    if (n <= 6)  return { text: `${n}日前`, color: "#c8860a", bg: "rgba(200, 134, 10, 0.1)" };

    return { text: `${n}日前`, color: c.red, bg: "rgba(235, 87, 87, 0.1)" };
}

const BookIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(55,53,47,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

const ChevronIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(55,53,47,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

// --- Styles ---

const section: React.CSSProperties = { marginBottom: "48px" };
const list: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "2px" };
const row: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 4px",
    borderBottom: `1px solid ${c.borderXs}`,
    cursor: "pointer",
};
const nameGroup: React.CSSProperties = { display: "flex", alignItems: "center", gap: "10px" };
const rightGroup: React.CSSProperties = { display: "flex", alignItems: "center", gap: "6px" };
const subjectText: React.CSSProperties = { fontSize: font.base, fontWeight: 500 };
const tagBase: React.CSSProperties = {
    padding: "2px 8px",
    borderRadius: "3px",
    fontSize: "12px",
    fontWeight: 500,
    whiteSpace: "nowrap",
};
