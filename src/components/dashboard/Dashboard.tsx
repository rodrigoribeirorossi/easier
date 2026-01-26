import { useEffect, useState } from 'react'
import useUser from '@/hooks/useUser'
import { api } from '@/lib/api'
import { DashboardSummary, Payment } from '@/types'
import { SummaryCards } from './SummaryCards'
import { CashFlowChart } from './CashFlowChart'
import { UpcomingPayments } from './UpcomingPayments'
import { parseAsLocalDate } from '@/lib/formatters'

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
  }, [user && user.id])

  async function loadDashboardData() {
    try {
      setLoading(true)
      
      const [accounts, transactions, payments, investments] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getPayments({ status: 'pending' }),
        api.getInvestments(),
      ])

      const totalBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0)
      const totalInvestments = investments.reduce((sum: number, inv: any) => sum + inv.currentAmount, 0)

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const monthTransactions = transactions.filter((t: any) => {
        const date = parseAsLocalDate(t.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })

      const monthIncome = monthTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0)

      const monthExpenses = monthTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0)

      setSummary({
        totalBalance,
        monthIncome,
        monthExpenses,
        monthSavings: monthIncome - monthExpenses,
        totalInvestments,
      })

      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        return date
      })

      const flowData = last6Months.map(date => {
        const monthTxs = transactions.filter((t: any) => {
          const txDate = parseAsLocalDate(t.date)
          return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear()
        })

        return {
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          income: monthTxs.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0),
          expense: monthTxs.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0),
        }
      })

      setCashFlowData(flowData)

      const sortedPayments = payments
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
