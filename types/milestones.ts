export interface Milestone {
  id: string
  title: string
  description: string
  dueDate: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue'
  type: 'planning' | 'permits' | 'construction' | 'inspection' | 'payment'
  amount?: number
  assignedTo?: string
  completedDate?: string
  dependencies?: string[]
}

export interface MilestoneFilters {
  status?: Milestone['status'][]
  type?: Milestone['type'][]
  dateRange?: {
    from: string | null
    to: string | null
  }
  assignedTo?: string[]
}

export const MILESTONE_STATUSES = [
  'upcoming',
  'in_progress', 
  'completed',
  'overdue'
] as const

export const MILESTONE_TYPES = [
  'planning',
  'permits',
  'construction', 
  'inspection',
  'payment'
] as const

export const STATUS_COLORS: Record<Milestone['status'], string> = {
  upcoming: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
}

export const TYPE_COLORS: Record<Milestone['type'], string> = {
  planning: 'bg-blue-100 text-blue-800',
  permits: 'bg-purple-100 text-purple-800',
  construction: 'bg-orange-100 text-orange-800',
  inspection: 'bg-green-100 text-green-800',
  payment: 'bg-yellow-100 text-yellow-800'
}

export function isMilestoneStatus(value: string): value is Milestone['status'] {
  return MILESTONE_STATUSES.includes(value as Milestone['status'])
}

export function isMilestoneType(value: string): value is Milestone['type'] {
  return MILESTONE_TYPES.includes(value as Milestone['type'])
}