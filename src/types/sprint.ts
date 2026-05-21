export type SprintType = 'backlog' | 'active'
export type SprintStatus = 'active' | 'completed'

export type Sprint = {
  id: number
  name: string
  goal: string | null
  retrospective: string | null
  type: SprintType
  status: SprintStatus
  startDate: string | null
  endDate: string | null
  completedAt: string | null
  createdAt: string
}

export type SprintInput = {
  name: string
  goal?: string
  startDate: string
  endDate: string
}

export type SprintUpdateInput = {
  name?: string
  goal?: string
  startDate?: string
  endDate?: string
}

export type SprintSubCategoryStats = {
  subCategoryId: number
  subCategoryName: string
  total: number
  done: number
}

export type SprintStats = {
  sprintId: number
  sprintName: string
  total: number
  done: number
  doing: number
  todo: number
  completionRate: number
  avgCompleteDays: number | null
  bySubCategory: SprintSubCategoryStats[]
}

export type TicketStatus = 'todo' | 'doing' | 'done'
export type TicketPriority = 'high' | 'medium' | 'low'
export type TicketType = 'knowledge' | 'practice' | 'understanding' | 'memorization'
export type TicketSource = 'wrong_answer' | 'load_map' | 'review' | 'manual'

export type TicketSubCategoryRef = {
  id: number
  name: string
  subject: string | null
}

export type StudyTicket = {
  id: number
  sprintId: number
  subject: string
  title: string
  acceptanceCriteria: string
  dueDate: string
  status: TicketStatus
  priority: TicketPriority
  ticketType: TicketType
  source: TicketSource
  estimateMinutes: number | null
  subCategories: TicketSubCategoryRef[]
  completedAt: string | null
  createdAt: string
}

export type StudyTicketInput = {
  sprintId?: number | null
  subject: string
  title: string
  acceptanceCriteria: string
  dueDate: string
  priority: TicketPriority
  ticketType: TicketType
  source: TicketSource
  estimateMinutes?: number | null
  subCategoryIds: number[]
}

export type StudyTicketUpdateInput = {
  subject?: string
  title?: string
  acceptanceCriteria?: string
  dueDate?: string
  status?: TicketStatus
  priority?: TicketPriority
  ticketType?: TicketType
  source?: TicketSource
  estimateMinutes?: number | null
  subCategoryIds?: number[]
}

export type TicketNote = {
  id: number
  ticketId: number
  body: string
  createdAt: string
  updatedAt: string
}

export type TicketNoteInput = {
  body: string
}

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  high: '↑',
  medium: '→',
  low: '↓',
}

export const PRIORITY_COLOR: Record<TicketPriority, string> = {
  high: '#d06d6d',
  medium: '#93b964',
  low: '#5e85ab',
}

export const TICKET_TYPE_LABEL: Record<TicketType, string> = {
  knowledge: '知識',
  practice: '演習',
  understanding: '理解',
  memorization: '暗記',
}

export const SOURCE_LABEL: Record<TicketSource, string> = {
  wrong_answer: '過去問ミス',
  load_map: 'ロードマップ',
  review: '見直し',
  manual: '手動',
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  todo: 'TODO',
  doing: 'DOING',
  done: 'DONE',
}
