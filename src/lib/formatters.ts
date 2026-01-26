export function formatCurrency(amount: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function parseAsLocalDate(date: Date | string | undefined | null): Date {
  if (!date) return new Date()
  if (date instanceof Date) return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (typeof date === 'string') {
    // treat plain YYYY-MM-DD as local date (avoid UTC midnight shift)
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) {
      const y = parseInt(m[1], 10)
      const mo = parseInt(m[2], 10) - 1
      const d = parseInt(m[3], 10)
      return new Date(y, mo, d)
    }
    const parsed = new Date(date)
    if (!isNaN(parsed.getTime())) {
      // If the string was a full ISO timestamp at UTC midnight (00:00:00Z),
      // treat it as a date-only value in local timezone to avoid showing previous day.
      // Detect by checking UTC hours/minutes/seconds are zero and the original
      // string contains a 'T' (iso) and a 'Z' (utc). This handles persisted
      // values like '2026-01-20T00:00:00.000Z'.
      const isIso = date.includes('T') && date.includes('Z')
      if (isIso && parsed.getUTCHours() === 0 && parsed.getUTCMinutes() === 0 && parsed.getUTCSeconds() === 0) {
        return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
      }
      return parsed
    }
  }
  return new Date()
}

export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = parseAsLocalDate(date)

  if (format === 'long') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(dateObj)
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj)
}

export function formatShortDate(date: Date | string): string {
  const dateObj = parseAsLocalDate(date)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(dateObj)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function getMonthName(monthIndex: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[monthIndex]
}

export function getDaysUntil(date: Date | string): number {
  const targetDate = parseAsLocalDate(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  const diff = targetDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(date: Date | string): boolean {
  return getDaysUntil(date) < 0
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    checking: 'Conta Corrente',
    savings: 'Poupança',
    credit_card: 'Cartão de Crédito',
    wallet: 'Carteira Digital',
    cash: 'Dinheiro',
  }
  return labels[type] || type
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Atrasado',
  }
  return labels[status] || status
}

export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    monthly: 'Mensal',
    weekly: 'Semanal',
    yearly: 'Anual',
  }
  return labels[frequency] || frequency
}

// Recurrence helpers
import { Payment } from '@/types'

export function generateRecurringDates(
  start: Date | string,
  frequency: string | undefined,
  end?: Date | string | null,
  maxMonths = 12
): Date[] {
  const dates: Date[] = []
  if (!frequency) return dates

  const startDate = parseAsLocalDate(start)
  const endDate = end ? parseAsLocalDate(end) : null

  // If no explicit end date, limit to maxMonths ahead
  const limitDate = endDate || new Date(new Date(startDate).setMonth(startDate.getMonth() + maxMonths))

  let current = new Date(startDate)
  while (current <= limitDate) {
    dates.push(new Date(current))

    if (frequency === 'weekly') {
      current.setDate(current.getDate() + 7)
    } else if (frequency === 'monthly') {
      // advance to next month keeping the same day when possible
      const day = current.getDate()
      current.setMonth(current.getMonth() + 1)
      // if month rolled over (e.g., Jan 31 -> Mar 3), clamp to last day
      while (current.getDate() < day) {
        current.setDate(current.getDate() + 1)
      }
    } else if (frequency === 'yearly') {
      current.setFullYear(current.getFullYear() + 1)
    } else {
      break
    }
  }

  return dates
}

export function expandRecurringPaymentOccurrences(payment: any, maxMonths = 12): any[] {
  if (!payment.isRecurring) return [payment]

  const dates = generateRecurringDates(payment.dueDate, payment.frequency, payment.recurrenceEndDate || null, maxMonths)

  // Map each generated date to a payment-like object (unique id per occurrence)
  return dates.map(d => {
    // find if there's an explicit occurrence stored in backend matching this date
    const occurrence = (payment.occurrences || []).find((o: any) => {
      const od = parseAsLocalDate(o.dueDate)
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth() && od.getDate() === d.getDate()
    })

    if (occurrence) {
      return {
        ...payment,
        id: occurrence.id,
        dueDate: parseAsLocalDate(occurrence.dueDate),
        status: occurrence.status,
      }
    }

    // if this is the original configured dueDate, keep original id and status
    const baseDate = parseAsLocalDate(payment.dueDate)
    if (baseDate.getFullYear() === d.getFullYear() && baseDate.getMonth() === d.getMonth() && baseDate.getDate() === d.getDate()) {
      return {
        ...payment,
        id: payment.id,
        dueDate: d,
        status: payment.status,
      }
    }

    return {
      ...payment,
      id: `${payment.id}::${d.toISOString()}`,
      dueDate: d,
      status: 'pending',
    }
  })
}
