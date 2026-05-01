import {daysAgo} from "../../types/workspace";
import {useState} from "react";
import {c, font} from "../../styles/notion";
import {useSettingsStore} from "../../lib/store/settings";

type SubjectResponse = { subject: string; lastDate: string | null };

type Props = {
    warningSubjects: SubjectResponse[];
};

export function AlertWidget({ warningSubjects }: Props) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const alertSettings = useSettingsStore((s) => s.alertSettings);

    const filteredSubjects = warningSubjects.filter((item) => {
        if (!item.lastDate) return alertSettings.includeUntouched;

        const diff = daysAgo(item.lastDate);
        return diff >= alertSettings.thresholdDays;
    });

    // 表示対象がない場合はレンダリングしない
    if (filteredSubjects.length === 0) return null;

    return (
        <div style={container}>
            <div style={header} onClick={() => setIsCollapsed(!isCollapsed)}>
                <div style={titleGroup}>
                    <AlertIcon />
                    <span style={title}>{filteredSubjects.length}科目の学習が滞っています</span>
                </div>
                <span style={toggle}>{isCollapsed ? "表示" : "隠す"}</span>
            </div>

            {!isCollapsed && (
                <div style={body}>
                    <div style={chips}>
                        {filteredSubjects.map((item) => {
                            const days = item.lastDate ? `${daysAgo(item.lastDate)}日前` : "未学習";

                            return (
                                <div key={item.subject} style={chip}>
                                    <span style={chipLabel}>{item.subject}</span>
                                    <span style={chipSub}>{days}</span>
                                </div>
                            );
                        })}
                    </div>
                    <p style={footer}>
                        「手薄な科目」を優先して、知識の風化を防ぎましょう。
                    </p>
                </div>
            )}
        </div>
    );
}

const AlertIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eb5757" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const container: React.CSSProperties = {
    backgroundColor: c.redBg,
    border: `1px solid ${c.redBorder}`,
    borderRadius: "8px",
    marginBottom: "24px",
    overflow: "hidden",
};

const header: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    cursor: "pointer",
};

const titleGroup: React.CSSProperties = { display: "flex", alignItems: "center", gap: "10px" };
const title: React.CSSProperties = { fontSize: "13px", fontWeight: 600, color: c.red };
const toggle: React.CSSProperties = {
    fontSize: font.sm,
    fontWeight: 600,
    color: "rgba(235, 87, 87, 0.5)",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
};

const body: React.CSSProperties = { padding: "0 16px 16px", borderTop: "rgba(235, 87, 87, 0.08) 1px solid" };
const chips: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "12px" };
const chip: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    padding: "6px 10px",
    backgroundColor: c.bg,
    border: `1px solid ${c.redBorder}`,
    borderRadius: "6px",
    minWidth: "100px",
};

const chipLabel: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: c.text };
const chipSub: React.CSSProperties = { fontSize: font.xs, color: c.textSub, marginTop: "2px" };
const footer: React.CSSProperties = { fontSize: font.sm, color: "rgba(235, 87, 87, 0.6)", marginTop: "12px", fontStyle: "italic" };