import { format, formatDistance, formatRelative, parseISO } from 'date-fns'

export function formatDate(date: string | Date, formatString: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

export function formatDateRelative(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatRelative(dateObj, new Date())
}

export function formatDateDistance(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

export function isDatePast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj < new Date()
}

export function getDaysBetween(start: string | Date, end: string | Date): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start
  const endDate = typeof end === 'string' ? parseISO(end) : end
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}