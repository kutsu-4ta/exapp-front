import type {CSSProperties} from "react"

export const SUBJECT_PALETTE = [
    { bg: 'rgba(35,131,226,0.1)', color: '#2383e2' },
    { bg: 'rgba(235,87,87,0.1)', color: '#eb5757' },
    { bg: 'rgba(242,171,38,0.1)', color: '#d4920f' },
    { bg: 'rgba(39,174,96,0.1)', color: '#19a576' },
    { bg: 'rgba(155,89,182,0.1)', color: '#8e44ad' },
    { bg: 'rgba(230,126,34,0.1)', color: '#c0392b' },
]

export function subjectPalette(subject: string) {
    let h = 0
    for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) & 0xffff
    return SUBJECT_PALETTE[h % SUBJECT_PALETTE.length]
}

export function subjectBadgeText(subject: string): string {
    return subject.charAt(0)
}

export const PROF_STYLE: Record<string, { color: string; bg: string }> = {
    '○': { color: '#19a576', bg: 'rgba(39,174,96,0.1)' },
    '△': { color: '#f2ab26', bg: '#fff5e0' },
    '×': { color: '#eb5757', bg: 'rgba(235,87,87,0.1)' },
}

export const PROF_COLORS: Record<string, string> = {
    '○': PROF_STYLE['○'].color,
    '△': PROF_STYLE['△'].color,
    '×': PROF_STYLE['×'].color,
}

export const subjectUi = {
    page: {
        background: "#fafafa",
        minHeight: "100vh",
        color: "#37352f",
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    } as CSSProperties,

    container: {
        maxWidth: "720px",
        margin: "0 auto",
        padding: "18px 14px 80px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    } as CSSProperties,

    subContainer: {
        marginBottom: '32px',
    } as CSSProperties,


    card: {
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: "12px",
        padding: "14px",
    } as CSSProperties,

    dangerCard: {
        background: "rgba(235,87,87,0.02)",
        border: "1px solid rgba(235,87,87,0.2)",
        borderRadius: "12px",
        padding: "14px",
    } as CSSProperties,

    title: {
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "rgba(0,0,0,0.35)",
        textTransform: "uppercase",
        marginBottom: "10px",
    } as CSSProperties,

    muted: {
        fontSize: "12px",
        color: "rgba(0,0,0,0.4)",
    } as CSSProperties,

    block: {
        marginBottom: "12px",
    } as CSSProperties,

    label: {
        fontSize: "12px",
        fontWeight: 600,
        marginBottom: "6px",
        display: "block",
    } as CSSProperties,

    input: {
        width: "100%",
        padding: "8px 10px",
        borderRadius: "8px",
        border: "1px solid rgba(0,0,0,0.1)",
        fontSize: "14px",
        outline: "none",
    } as CSSProperties,

    textarea: {
        width: "100%",
        padding: "8px 10px",
        borderRadius: "8px",
        border: "1px solid rgba(0,0,0,0.1)",
        resize: "none",
        fontSize: "14px",
    } as CSSProperties,

    monthNav: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    } as CSSProperties,

    navBtn: {
        width: "24px",
        height: "24px",
        borderRadius: "6px",
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#fff",
        cursor: "pointer",
    } as CSSProperties,

    monthLabel: {
        fontSize: "12px",
        fontWeight: 600,
    } as CSSProperties,

    badge: {
        marginLeft: "6px",
        fontSize: "10px",
        padding: "2px 6px",
        borderRadius: "6px",
        background: "#e8f5ff",
        color: "#2b6cb0",
    } as CSSProperties,

    row: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
    },
    text: {
        fontSize: '14px',
        color: '#37352f',
    },
    button: {
        fontSize: '12px',
        fontWeight: 600,
        border: '1px solid rgba(55,53,47,0.1)',
        background: 'white', borderRadius: '6px',
        padding: '4px 8px',
        cursor: 'pointer', },
    dangerButton: {
        fontSize: '12px',
        fontWeight: 600,
        border: '1px solid rgba(235,87,87,0.2)',
        background: 'rgba(235,87,87,0.05)',
        color: '#eb5757', borderRadius: '6px',
        padding: '6px 10px', cursor: 'pointer',
    },
    divider: {
        height: '1px', background: 'rgba(55,53,47,0.06)',
        margin: '10px 0', }, subCategoryTag: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, lineHeight: '1.2', letterSpacing: '0.01em',
    },

    sectionHeadingWrap: {
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },

    sectionHeading: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(55, 53, 47, 0.35)',
    letterSpacing: '0.06em',
    },
}