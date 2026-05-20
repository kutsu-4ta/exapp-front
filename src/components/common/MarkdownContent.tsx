import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import {c} from '@/styles/notion'

// ── ハッシュタグチップ ────────────────────────────────────────────────────────

export const HASHTAG_KEYS = ['Definition', 'Keyword', 'Pitfall', 'Example', 'Relation', 'MemoryHook', 'Formula'] as const
export type HashtagKey = (typeof HASHTAG_KEYS)[number]

export const HASHTAG_MAP: Record<string, { label: string; color: string; bg: string }> = {
    Definition:  { label: '定義',           color: '#2383e2', bg: 'rgba(35,131,226,0.10)'  },
    Keyword:     { label: '重要語',         color: '#27ae60', bg: 'rgba(39,174,96,0.10)'   },
    Pitfall:     { label: '間違えやすい点', color: '#eb5757', bg: 'rgba(235,87,87,0.10)'   },
    Example:     { label: '具体例',         color: '#f2ab26', bg: 'rgba(242,171,38,0.10)'  },
    Relation:    { label: '他概念との関係', color: '#9b59b6', bg: 'rgba(155,89,182,0.10)'  },
    MemoryHook:  { label: '覚え方',         color: '#e67e22', bg: 'rgba(230,126,34,0.10)'  },
    Formula:     { label: '公式',           color: '#0d9488', bg: 'rgba(13,148,136,0.10)'  },
}

const HASHTAG_RE = /#(Definition|Keyword|Pitfall|Example|Relation|MemoryHook|Formula)(?=\s|$)/g

/** テキスト中の #Tag（半角スペース付き）をチップ要素に変換する */
function renderTextWithChips(text: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    let last = 0
    HASHTAG_RE.lastIndex = 0
    let m: RegExpExecArray | null

    while ((m = HASHTAG_RE.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index))
        const info = HASHTAG_MAP[m[1]]
        parts.push(
            <span
                key={`${m[1]}-${m.index}`}
                style={{
                    display: 'inline-block',
                    padding: '1px 8px 2px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: info.color,
                    backgroundColor: info.bg,
                    border: `1px solid ${info.color}38`,
                    marginRight: '4px',
                    verticalAlign: 'middle',
                    lineHeight: 1.7,
                    letterSpacing: '0.01em',
                    whiteSpace: 'nowrap',
                }}
            >
                {info.label}
            </span>
        )
        last = m.index + m[0].length
    }

    if (last < text.length) parts.push(text.slice(last))
    if (parts.length === 0) return text
    if (parts.length === 1) return parts[0]
    return <>{parts}</>
}

/**
 * ReactMarkdown の children（string | ReactNode | ReactNode[]）を走査して
 * 文字列ノードだけにチップ変換を適用する。
 */
function applyChips(children: React.ReactNode): React.ReactNode {
    if (typeof children === 'string') {
        return renderTextWithChips(children)
    }
    if (Array.isArray(children)) {
        return children.map((child, i) =>
            typeof child === 'string'
                ? <React.Fragment key={i}>{renderTextWithChips(child)}</React.Fragment>
                : child
        )
    }
    return children
}

// ── コンポーネント ────────────────────────────────────────────────────────────

type Props = {
    children: React.ReactNode
}

export function MarkdownContent({ children }: Props) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
                p:          ({ children }) => <p          style={mdP}>{applyChips(children)}</p>,
                h1:         ({ children }) => <h1         style={mdH1}>{applyChips(children)}</h1>,
                h2:         ({ children }) => <h2         style={mdH2}>{applyChips(children)}</h2>,
                h3:         ({ children }) => <h3         style={mdH3}>{applyChips(children)}</h3>,
                li:         ({ children }) => <li         style={mdLi}>{applyChips(children)}</li>,
                blockquote: ({ children }) => <blockquote style={mdBlockquote}>{applyChips(children)}</blockquote>,
                strong:     ({ children }) => <strong     style={mdStrong}>{applyChips(children)}</strong>,
                td:         ({ children }) => <td         style={mdTd}>{applyChips(children)}</td>,
                th:         ({ children }) => <th         style={mdTh}>{applyChips(children)}</th>,

                ul: ({ children }) => <ul style={mdUl}>{children}</ul>,
                ol: ({ children }) => <ol style={mdOl}>{children}</ol>,
                code: ({ children }) => <code style={mdCode}>{children}</code>,

                table: ({ children }) => (
                    <div style={mdTableWrapper}>
                        <table style={mdTable}>{children}</table>
                    </div>
                ),
                thead: ({ children }) => <thead style={mdThead}>{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr:    ({ children }) => <tr>{children}</tr>,
            }}
        >
            {String(children ?? '')}
        </ReactMarkdown>
    )
}

// ── スタイル ─────────────────────────────────────────────────────────────────

const mdP: React.CSSProperties = {
    margin: '0 0 12px',
    lineHeight: 1.6,
    color: c.text,
}

const mdH1: React.CSSProperties = {
    margin: '8px 0 6px',
    fontSize: '20px',
    fontWeight: 800,
    lineHeight: 1.4,
    color: c.text,
}

const mdH2: React.CSSProperties = {
    margin: '8px 0 6px',
    fontSize: '17px',
    fontWeight: 700,
    lineHeight: 1.4,
    color: c.text,
}

const mdH3: React.CSSProperties = {
    margin: '6px 0 4px',
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: 1.4,
    color: c.text,
}

const mdUl: React.CSSProperties = {
    margin: '6px 0',
    paddingLeft: '20px',
    listStyleType: 'disc',
    listStylePosition: 'outside',
}

const mdOl: React.CSSProperties = {
    margin: '6px 0',
    paddingLeft: '20px',
    listStyleType: 'decimal',
    listStylePosition: 'outside',
}

const mdLi: React.CSSProperties = {
    marginBottom: '4px',
    lineHeight: 1.6,
    color: c.text,
    display: 'list-item',
}

const mdStrong: React.CSSProperties = {
    fontWeight: 700,
    color: c.text,
}

const mdBlockquote: React.CSSProperties = {
    margin: '8px 0',
    padding: '8px 12px',
    borderLeft: '3px solid rgba(55,53,47,0.18)',
    backgroundColor: 'rgba(55,53,47,0.03)',
    borderRadius: '6px',
    color: c.textSub,
}

const mdCode: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '0.9em',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(55,53,47,0.08)',
}

const mdTableWrapper: React.CSSProperties = {
    overflowX: 'auto',
    margin: '12px 0',
    border: '1px solid rgba(55,53,47,0.09)',
    borderRadius: '8px',
}

const mdTable: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    color: c.text,
}

const mdThead: React.CSSProperties = {
    backgroundColor: 'rgba(55,53,47,0.03)',
}

const mdTh: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '1px solid rgba(55,53,47,0.09)',
    whiteSpace: 'nowrap',
}

const mdTd: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(55,53,47,0.06)',
    lineHeight: 1.5,
}
