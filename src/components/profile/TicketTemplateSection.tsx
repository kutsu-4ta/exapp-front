import {useState} from 'react'
import {c, font, formInput, formLabel} from '../../styles/notion'
import {SOURCE_LABEL, type TicketSource} from '../../types/sprint'
import {DEFAULT_TEMPLATES, useTicketTemplateStore} from '../../lib/store/ticketTemplates'

const SOURCES: TicketSource[] = ['wrong_answer', 'load_map', 'review', 'manual']

const SOURCE_VARS: Record<TicketSource, string> = {
  wrong_answer: '{{examYear}} {{rank}} {{count}} {{subject}} {{questions}}',
  load_map:     '{{subject}}',
  review:       '{{subject}}',
  manual:       '',
}

export function TicketTemplateSection() {
  const {templates, setTemplate, resetTemplate} = useTicketTemplateStore()
  const [openSource, setOpenSource] = useState<TicketSource | null>('wrong_answer')

  return (
    <div style={wrap}>
      <p style={hint}>発生源ごとにチケット生成時のタイトル・達成基準テンプレートを設定できます。</p>
      {SOURCES.map((source) => {
        const isOpen = openSource === source
        const tmpl = templates[source]
        const isModified =
          tmpl.title !== DEFAULT_TEMPLATES[source].title ||
          tmpl.acceptanceCriteria !== DEFAULT_TEMPLATES[source].acceptanceCriteria

        return (
          <div key={source} style={card}>
            <button
              style={cardHeader}
              onClick={() => setOpenSource(isOpen ? null : source)}
            >
              <span style={sourceLabel}>{SOURCE_LABEL[source]}</span>
              {isModified && <span style={modifiedDot} />}
              <span style={chevron}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div style={cardBody}>
                {SOURCE_VARS[source] && (
                  <p style={varHint}>利用可能な変数: <code style={code}>{SOURCE_VARS[source]}</code></p>
                )}

                <div style={fieldWrap}>
                  <label style={formLabel}>タイトル</label>
                  <input
                    style={{...formInput, marginTop: 4}}
                    value={tmpl.title}
                    onChange={(e) => setTemplate(source, {...tmpl, title: e.target.value})}
                    placeholder="チケットタイトルのテンプレート"
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={formLabel}>達成基準</label>
                  <textarea
                    style={{...formInput, marginTop: 4, minHeight: 100, resize: 'vertical', fontFamily: 'inherit'}}
                    value={tmpl.acceptanceCriteria}
                    onChange={(e) => setTemplate(source, {...tmpl, acceptanceCriteria: e.target.value})}
                    placeholder="達成基準のテンプレート"
                  />
                </div>

                {isModified && (
                  <button
                    style={resetBtn}
                    onClick={() => resetTemplate(source)}
                  >
                    デフォルトに戻す
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 24,
}
const hint: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: font.sm,
  color: c.textHint,
  lineHeight: 1.6,
}
const card: React.CSSProperties = {
  border: `1px solid ${c.border}`,
  borderRadius: 8,
  overflow: 'hidden',
}
const cardHeader: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
}
const sourceLabel: React.CSSProperties = {
  flex: 1,
  fontSize: font.base,
  fontWeight: 700,
  color: c.text,
}
const modifiedDot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: c.blue,
  flexShrink: 0,
}
const chevron: React.CSSProperties = {
  fontSize: 10,
  color: c.textHint,
  flexShrink: 0,
}
const cardBody: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '12px 14px 14px',
  borderTop: `1px solid ${c.border}`,
  backgroundColor: 'rgba(55,53,47,0.015)',
}
const fieldWrap: React.CSSProperties = {display: 'flex', flexDirection: 'column'}
const varHint: React.CSSProperties = {
  margin: 0,
  fontSize: font.xs,
  color: c.textHint,
  lineHeight: 1.5,
}
const code: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: font.xs,
  background: 'rgba(55,53,47,0.06)',
  padding: '1px 4px',
  borderRadius: 3,
}
const resetBtn: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '3px 10px',
  border: `1px solid ${c.border}`,
  borderRadius: 6,
  background: 'none',
  fontSize: font.xs,
  color: c.textHint,
  cursor: 'pointer',
}
