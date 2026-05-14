import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import {c} from '@/styles/notion'

type Props = {
    children: React.ReactNode
}

export function MarkdownContent({ children }: Props) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
                p: ({ children }) => <p style={mdP}>{children}</p>,
                h1: ({ children }) => <h1 style={mdH1}>{children}</h1>,
                h2: ({ children }) => <h2 style={mdH2}>{children}</h2>,
                h3: ({ children }) => <h3 style={mdH3}>{children}</h3>,
                ul: ({ children }) => <ul style={mdUl}>{children}</ul>,
                ol: ({ children }) => <ol style={mdOl}>{children}</ol>,
                li: ({ children }) => <li style={mdLi}>{children}</li>,
                strong: ({ children }) => (
                    <strong style={mdStrong}>{children}</strong>
                ),
                blockquote: ({ children }) => (
                    <blockquote style={mdBlockquote}>{children}</blockquote>
                ),
                code: ({ children }) => (
                    <code style={mdCode}>{children}</code>
                ),

                // table
                table: ({ children }) => (
                    <div style={mdTableWrapper}>
                        <table style={mdTable}>{children}</table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead style={mdThead}>{children}</thead>
                ),
                tbody: ({ children }) => (
                    <tbody>{children}</tbody>
                ),
                tr: ({ children }) => <tr>{children}</tr>,
                th: ({ children }) => (
                    <th style={mdTh}>{children}</th>
                ),
                td: ({ children }) => (
                    <td style={mdTd}>{children}</td>
                ),
            }}
        >
            {String(children ?? '')}
        </ReactMarkdown>
    )
}

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
}

const mdOl: React.CSSProperties = {
    margin: '6px 0',
    paddingLeft: '20px',
}

const mdLi: React.CSSProperties = {
    marginBottom: '4px',
    lineHeight: 1.6,
    color: c.text,
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

// table styles
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