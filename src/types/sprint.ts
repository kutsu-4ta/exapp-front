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
export type TicketSource = 'wrong_answer' | 'mock_exam' | 'review' | 'manual'

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
  high: '高',
  medium: '中',
  low: '低',
}

export const PRIORITY_COLOR: Record<TicketPriority, string> = {
  high: '#eb5757',
  medium: '#f5a623',
  low: '#2383e2',
}

export const TICKET_TYPE_LABEL: Record<TicketType, string> = {
  knowledge: '知識',
  practice: '演習',
  understanding: '理解',
  memorization: '暗記',
}

export const TICKET_TYPE_SHORT: Record<TicketType, string> = {
  knowledge: '知',
  practice: '演',
  understanding: '理',
  memorization: '記',
}

export const SOURCE_LABEL: Record<TicketSource, string> = {
  wrong_answer: '過去問ミス',
  mock_exam: '模試',
  review: '見直し',
  manual: '手動',
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  todo: 'TODO',
  doing: 'DOING',
  done: 'DONE',
}
