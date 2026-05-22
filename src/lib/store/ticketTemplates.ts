import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import type {TicketSource} from '../../types/sprint'

export type TicketTemplate = {
  title: string
  acceptanceCriteria: string
}

export const DEFAULT_TEMPLATES: Record<TicketSource, TicketTemplate> = {
  wrong_answer: {
    title: '[{{examYear}}] {{rank}}ランク 問題の復習（{{count}}問）',
    acceptanceCriteria: '{{rank}}ランクの問題を正確に解けるようになる\n\n対象問題:\n{{questions}}',
  },
  load_map: {
    title: '{{subject}} ロードマップ学習',
    acceptanceCriteria: '',
  },
  review: {
    title: '{{subject}} 見直し',
    acceptanceCriteria: '',
  },
  manual: {
    title: '',
    acceptanceCriteria: '',
  },
}

// wrong_answer: {{examYear}} {{rank}} {{count}} {{subject}} {{questions}}
// その他:       {{subject}}
export function applyTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{{${k}}}`, v),
    template
  )
}

interface TicketTemplateState {
  templates: Record<TicketSource, TicketTemplate>
  setTemplate: (source: TicketSource, template: TicketTemplate) => void
  resetTemplate: (source: TicketSource) => void
}

export const useTicketTemplateStore = create<TicketTemplateState>()(
  persist(
    (set) => ({
      templates: {...DEFAULT_TEMPLATES},
      setTemplate: (source, template) =>
        set((s) => ({templates: {...s.templates, [source]: template}})),
      resetTemplate: (source) =>
        set((s) => ({templates: {...s.templates, [source]: DEFAULT_TEMPLATES[source]}})),
    }),
    {name: 'ticket-templates'}
  )
)
