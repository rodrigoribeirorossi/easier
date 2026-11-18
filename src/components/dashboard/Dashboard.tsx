import { useEffect, useState } from 'react'
import useUser from '@/hooks/useUser'
import { api } from '@/lib/api'
import { DashboardSummary, Payment } from '@/types'
import { SummaryCards } from './SummaryCards'
import { CashFlowChart } from './CashFlowChart'
import { UpcomingPayments } from './UpcomingPayments'
import { parseAsLocalDate, generateRecurringDates, expandRecurringPaymentOccurrences } from '@/lib/formatters'

interface CashFlowData {
  month: string
  income: number
  expense: number
}

export function Dashboard() {
  const { user } = useUser()
  const [summary, setSummary] = useState<DashboardSummary>({
    totalBalance: 0,
    monthIncome: 0,
    monthExpenses: 0,
    monthSavings: 0,
    totalInvestments: 0,
  })
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If no user is logged, clear data and skip fetching
    if (!user) {
      setSummary({
        totalBalance: 0,
        monthIncome: 0,
        monthExpenses: 0,
        monthSavings: 0,
        totalInvestments: 0,
      })
      setCashFlowData([])
      setUpcomingPayments([])
      setLoading(false)
      return
    }

    loadDashboardData()
  }, [user?.id])

  async function loadDashboardData() {
    try {
      setLoading(true)
      
      const [accounts, transactions, payments, investments] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getPayments(),
        api.getInvestments(),
      ])

      const totalBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0)
      const totalInvestments = investments.reduce((sum: number, inv: any) => sum + inv.currentAmount, 0)

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      // Expand recurring transactions into occurrences for the year
      const expandedTransactions: any[] = []
      transactions.forEach((t: any) => {
        if (t.isRecurring) {
          const dates = generateRecurringDates(t.date, t.frequency, t.recurrenceEndDate || null, 12)
          dates.forEach((d: Date) => {
            expandedTransactions.push({ ...t, date: d })
          })
        } else {
          expandedTransactions.push(t)
        }
      })

      // Expand recurring payments into occurrences for the year
      const expandedPayments: any[] = []
      payments.forEach((p: any) => {
        if (p.isRecurring) {
          const occ = expandRecurringPaymentOccurrences(p, 12)
          expandedPayments.push(...occ)
        } else {
          expandedPayments.push(p)
        }
      })

      const monthIncome = expandedTransactions
        .filter((t: any) => {
          const d = parseAsLocalDate(t.date)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'income'
        })
        .reduce((sum: number, t: any) => sum + t.amount, 0)

      const monthExpensesFromTx = expandedTransactions
        .filter((t: any) => {
          const d = parseAsLocalDate(t.date)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense'
        })
        .reduce((sum: number, t: any) => sum + t.amount, 0)

      const monthExpensesFromPayments = expandedPayments
        .filter((p: any) => {
          const d = parseAsLocalDate(p.dueDate)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
        .reduce((sum: number, p: any) => sum + p.amount, 0)

      const monthExpenses = monthExpensesFromTx + monthExpensesFromPayments

      setSummary({
        totalBalance,
        monthIncome,
        monthExpenses,
        monthSavings: monthIncome - monthExpenses,
        totalInvestments,
      })

      // Build monthly data for all months of the current year (Jan..Dec)
      const monthsOfYear = Array.from({ length: 12 }, (_, m) => new Date(currentYear, m, 1))

      const flowData = monthsOfYear.map(date => {
        const monthIndex = date.getMonth()

        const income = expandedTransactions
          .filter((t: any) => {
            const d = parseAsLocalDate(t.date)
            return d.getMonth() === monthIndex && d.getFullYear() === currentYear && t.type === 'income'
          })
          .reduce((sum: number, t: any) => sum + t.amount, 0)

        const expenseFromTx = expandedTransactions
          .filter((t: any) => {
            const d = parseAsLocalDate(t.date)
            return d.getMonth() === monthIndex && d.getFullYear() === currentYear && t.type === 'expense'
          })
          .reduce((sum: number, t: any) => sum + t.amount, 0)

        const expenseFromPayments = expandedPayments
          .filter((p: any) => {
            const d = parseAsLocalDate(p.dueDate)
            return d.getMonth() === monthIndex && d.getFullYear() === currentYear
          })
          .reduce((sum: number, p: any) => sum + p.amount, 0)

        return {
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          income,
          expense: expenseFromTx + expenseFromPayments,
        }
      })

      setCashFlowData(flowData)

      const sortedPayments = expandedPayments
        .filter((p: any) => p.status === 'pending')
        .sort((a: any, b: any) => parseAsLocalDate(a.dueDate).getTime() - parseAsLocalDate(b.dueDate).getTime())
        .slice(0, 5)

      setUpcomingPayments(sortedPayments)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} loading={loading} />
      
      <div className="grid gap-6 md:grid-cols-2">
        <CashFlowChart data={cashFlowData} loading={loading} />
        <UpcomingPayments payments={upcomingPayments} loading={loading} />
      </div>
    </div>
  )
}
