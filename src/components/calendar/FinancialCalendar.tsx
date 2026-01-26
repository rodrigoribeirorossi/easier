import { useState, useEffect } from 'react'
import useUser from '@/hooks/useUser'
import { api } from '@/lib/api'
import { Payment } from '@/types'
import { expandRecurringPaymentOccurrences, generateRecurringDates, formatCurrency, getMonthName, parseAsLocalDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CreditCard, Plus, Scale } from 'lucide-react'
import { PaymentEvent } from './PaymentEvent'

export function FinancialCalendar() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [incomeItems, setIncomeItems] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [entriesSum, setEntriesSum] = useState(0)
  const [paymentsSum, setPaymentsSum] = useState(0)

  const { user } = useUser()

  useEffect(() => {
    if (!user) {
      setPayments([])
      setLoading(false)
      return
    }
    loadPayments()
  }, [user && user.id, currentDate])

  async function loadPayments() {
    try {
      setLoading(true)
      const [paymentsData, incomesData] = await Promise.all([
        api.getPayments(),
        api.getTransactions({ type: 'income' }),
      ])
      console.debug('[Calendar] paymentsData count', (paymentsData || []).length)
      console.debug('[Calendar] incomesData count', (incomesData || []).length, incomesData && (incomesData.slice ? incomesData.slice(0,3) : incomesData))
      // Expand recurring payments into occurrences for the calendar view
      const expandedPayments: Payment[] = []
      paymentsData.forEach((p: Payment) => {
        if (p.isRecurring) {
          const occ = expandRecurringPaymentOccurrences(p, 12)
          expandedPayments.push(...occ)
        } else {
          expandedPayments.push(p)
        }
      })

      // helper: parse transaction date as local date (avoid UTC shift)
      const parseTransactionDate = (dateVal: string | Date) => {
        if (!dateVal) return new Date()
        const s = typeof dateVal === 'string' ? dateVal : dateVal.toISOString()
        const datePart = s.slice(0, 10)
        const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10))
        return new Date(y, m - 1, d)
      }

      // map incomes (transactions) to calendar items (use local-date parsing to avoid timezone shift)
      const expandedIncomes: any[] = []
      incomesData.forEach((t: any) => {
        if (t.isRecurring) {
          const dates = generateRecurringDates(t.date, t.frequency, t.recurrenceEndDate || null, 12)
          dates.forEach((d: Date) => {
            const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
            expandedIncomes.push({
              id: `txn::${t.id}::${local.toISOString()}`,
              name: t.description,
              amount: t.amount,
              dueDate: local,
              status: 'paid',
              isRecurring: false,
              _type: 'income',
              type: 'income',
            } as any)
          })
        } else {
          const localDate = parseTransactionDate(t.date)
          expandedIncomes.push({
            id: `txn::${t.id}`,
            name: t.description,
            amount: t.amount,
            dueDate: localDate,
            status: 'paid',
            isRecurring: false,
            _type: 'income',
            type: 'income',
          } as any)
        }
      })

      setPayments(expandedPayments)
      setIncomeItems(expandedIncomes)

      // compute entries sum for current month
      // compute entries sum for current month using normalized income items
      const entriesSumVal = expandedIncomes.filter((t: any) => {
        const d = parseAsLocalDate(t.dueDate)
        return d.getFullYear() === year && d.getMonth() === month
      }).reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0)
      setEntriesSum(entriesSumVal)
      // also compute payments sum for current month to use in balance/coloring
      const paymentsSumVal = expandedPayments.filter((p: any) => {
        const d = parseAsLocalDate(p.dueDate)
        return d.getFullYear() === year && d.getMonth() === month
      }).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)
      setPaymentsSum(paymentsSumVal)
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getPaymentsForDay = (day: number) => {
    const p = payments.filter(payment => {
      const paymentDate = parseAsLocalDate(payment.dueDate)
      return paymentDate.getDate() === day &&
             paymentDate.getMonth() === month &&
             paymentDate.getFullYear() === year
    })
    const i = incomeItems.filter((income) => {
      const d = parseAsLocalDate(income.dueDate)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })
    return [...p, ...i]
  }

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Calendário Financeiro</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {getMonthName(month)} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-96 bg-muted animate-pulse rounded" />
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => (
                <div key={day} className="text-center font-semibold text-sm p-2 text-muted-foreground">
                  {day}
                </div>
              ))}

              {days.map((day, index) => {
                const isToday = day === new Date().getDate() && 
                               month === new Date().getMonth() && 
                               year === new Date().getFullYear()
                const dayPayments = day ? getPaymentsForDay(day) : []

                return (
                  <div
                    key={index}
                    className={`min-h-24 p-2 border border-border rounded-lg ${
                      !day ? 'bg-muted/50' : isToday ? 'bg-primary/10 border-primary' : 'bg-card'
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-2 ${
                          isToday ? 'text-primary' : 'text-foreground'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayPayments.map(payment => (
                            <PaymentEvent key={payment.id} payment={payment} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly summary cards */}
      <div className="flex justify-center">
        <div className="w-full max-w-5xl px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2 min-h-12">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                  <CardTitle>Total de pagamentos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="pl-8">
                  <div className="h-8 overflow-hidden">
                    <p className="text-xs text-muted-foreground mt-0 mb-2">Soma de todos os pagamentos registrados no mês selecionado</p>
                  </div>
                  <div className="border-t border-border mt-2 mb-3" />
                  <div className="mt-2">
                    <p className="text-2xl font-semibold">
                      {formatCurrency(
                        payments
                          .filter(p => {
                            const d = new Date(p.dueDate)
                            return d.getFullYear() === year && d.getMonth() === month
                          })
                          .reduce((s, p) => s + (Number(p.amount) || 0), 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 min-h-12">
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5 text-green-500" />
                  <CardTitle>Entradas do mês</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="pl-8">
                  <div className="h-8 overflow-hidden">
                    <p className="text-xs text-muted-foreground mt-0 mb-2">Total de entradas do mês</p>
                  </div>
                  <div className="border-t border-border mt-2 mb-3" />
                  <div className="mt-2">
                    <p className="text-2xl font-semibold">{formatCurrency(entriesSum)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 min-h-12">
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Saldo Mensal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="pl-8">
                  <div className="h-8 overflow-hidden">
                    <p className="text-xs text-muted-foreground mt-0 mb-2">Entradas do mês - Total de pagamentos</p>
                  </div>
                  <div className="border-t border-border mt-2 mb-3" />
                  <div className="mt-2">
                    <p className={`text-2xl font-semibold ${entriesSum - paymentsSum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(entriesSum - paymentsSum)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
