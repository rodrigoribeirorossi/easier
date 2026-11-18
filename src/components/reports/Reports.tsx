import { useState, useEffect } from 'react'
import useUser from '@/hooks/useUser'
import { api } from '@/lib/api'
import { CategoryChart } from './CategoryChart'
import { EvolutionChart } from './EvolutionChart'
import { MonthlyComparison } from './MonthlyComparison'
import { parseAsLocalDate, expandRecurringPaymentOccurrences } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CategoryData {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

interface MonthData {
  month: string
  income: number
  expense: number
  balance: number
}

interface EvolutionData {
  month: string
  netWorth: number
}

const categoryColors = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

export function Reports() {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([])
  const [loading, setLoading] = useState(true)

  // selectedDate represents the month being viewed (month + year)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')

  const { user } = useUser()

  const padMonth = (n: number) => String(n).padStart(2, '0')
  const monthInputValue = (d: Date) => `${d.getFullYear()}-${padMonth(d.getMonth() + 1)}`

  const prevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))
  const nextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))
  const setMonthFromInput = (v: string) => {
    if (!v) return
    const [y, m] = v.split('-').map(Number)
    if (!y || !m) return
    setSelectedDate(new Date(y, m - 1, 1))
  }

  useEffect(() => {
    if (!user) {
      setCategoryData([])
      setMonthlyData([])
      setEvolutionData([])
      setLoading(false)
      return
    }
    loadReportsData()
  }, [user?.id, selectedDate, selectedStatus])

  async function loadReportsData() {
    try {
      setLoading(true)
      // fetch both transactions and payments; category chart should show payments by category
      const [transactions, payments] = await Promise.all([
        api.getTransactions(),
        api.getPayments(),
      ])
      const currentMonth = selectedDate.getMonth()
      const currentYear = selectedDate.getFullYear()

      // Expand recurring payments into occurrences so each occurrence is counted in its month
      const expandedPayments: any[] = []
      ;(payments || []).forEach((p: any) => {
        if (p.isRecurring) {
          const occ = expandRecurringPaymentOccurrences(p, 12)
          expandedPayments.push(...occ)
        } else {
          expandedPayments.push(p)
        }
      })

      // Category data: use payments (including occurrences) registered in the selected month
      let currentMonthPayments = expandedPayments.filter((p: any) => {
        const date = parseAsLocalDate(p.dueDate || p.date || p.createdAt)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })

      // apply status filter if requested
      if (selectedStatus && selectedStatus !== 'all') {
        currentMonthPayments = currentMonthPayments.filter((p: any) => p.status === selectedStatus)
      }

      const categoryMap = new Map<string, number>()
      currentMonthPayments.forEach((p: any) => {
        if (p.category) {
          const name = typeof p.category === 'string' ? p.category : p.category.name
          const current = categoryMap.get(name) || 0
          categoryMap.set(name, current + (Number(p.amount) || 0))
        }
      })

      const catData: CategoryData[] = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: categoryColors[index % categoryColors.length],
      }))
      setCategoryData(catData)

      // Build 6-month window starting at selectedDate (selected month on the left, following months to the right)
      const comparisonMonths = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + i, 1)
        return date
      })

      const monthlyComparison = comparisonMonths.map(date => {
        const monthTxs = (transactions || []).filter((t: any) => {
          const txDate = parseAsLocalDate(t.date)
          return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear()
        })

        const income = monthTxs
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + t.amount, 0)

        const expenseFromTx = monthTxs
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + t.amount, 0)

        // include payments occurrences in expense calculation
        const paymentsForMonth = expandedPayments.filter((p: any) => {
          const pd = parseAsLocalDate(p.dueDate || p.date || p.createdAt)
          return pd.getMonth() === date.getMonth() && pd.getFullYear() === date.getFullYear()
        })
        const expenseFromPayments = paymentsForMonth.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)

        const expense = expenseFromTx + expenseFromPayments

        return {
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          income,
          expense,
          balance: income - expense,
        }
      })
      setMonthlyData(monthlyComparison)

      let runningTotal = 0
      const evolution = last6Months.map(date => {
        const monthTxs = (transactions || []).filter((t: any) => {
          const txDate = parseAsLocalDate(t.date)
          return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear()
        })

        const monthBalance = monthTxs.reduce((sum: number, t: any) => {
          return sum + (t.type === 'income' ? t.amount : -t.amount)
        }, 0)

        runningTotal += monthBalance

        return {
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          netWorth: runningTotal,
        }
      })
      setEvolutionData(evolution)

    } catch (error) {
      console.error('Failed to load reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Relatórios</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            aria-label="Selecionar mês"
            type="month"
            className="border border-border rounded px-2 py-1 bg-transparent text-sm"
            value={monthInputValue(selectedDate)}
            onChange={(e) => setMonthFromInput(e.target.value)}
          />
          <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryChart
          data={categoryData}
          loading={loading}
          selectedDate={selectedDate}
          onPrev={prevMonth}
          onNext={nextMonth}
          selectedStatus={selectedStatus}
          onStatusChange={(s) => setSelectedStatus(s)}
        />
        <EvolutionChart
          data={evolutionData}
          loading={loading}
          selectedDate={selectedDate}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
      </div>

      <MonthlyComparison
        data={monthlyData}
        loading={loading}
        selectedDate={selectedDate}
        onPrev={prevMonth}
        onNext={nextMonth}
      />
    </div>
  )
}
