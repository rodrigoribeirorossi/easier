import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { CategoryChart } from './CategoryChart'
import { EvolutionChart } from './EvolutionChart'
import { MonthlyComparison } from './MonthlyComparison'

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

  useEffect(() => {
    loadReportsData()
  }, [])

  async function loadReportsData() {
    try {
      setLoading(true)
      
      const transactions = await api.getTransactions()

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const currentMonthTransactions = transactions.filter((t: any) => {
        const date = new Date(t.date)
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear &&
               t.type === 'expense'
      })

      const categoryMap = new Map<string, number>()
      currentMonthTransactions.forEach((t: any) => {
        if (t.category) {
          const current = categoryMap.get(t.category.name) || 0
          categoryMap.set(t.category.name, current + t.amount)
        }
      })

      const catData: CategoryData[] = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: categoryColors[index % categoryColors.length],
      }))
      setCategoryData(catData)

      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        return date
      })

      const monthlyComparison = last6Months.map(date => {
        const monthTxs = transactions.filter((t: any) => {
          const txDate = new Date(t.date)
          return txDate.getMonth() === date.getMonth() && 
                 txDate.getFullYear() === date.getFullYear()
        })

        const income = monthTxs
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + t.amount, 0)

        const expense = monthTxs
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + t.amount, 0)

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
        const monthTxs = transactions.filter((t: any) => {
          const txDate = new Date(t.date)
          return txDate.getMonth() === date.getMonth() && 
                 txDate.getFullYear() === date.getFullYear()
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryChart data={categoryData} loading={loading} />
        <EvolutionChart data={evolutionData} loading={loading} />
      </div>

      <MonthlyComparison data={monthlyData} loading={loading} />
    </div>
  )
}
