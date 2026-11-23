import { useState, useEffect } from 'react'
import useUser from '@/hooks/useUser'
import { api } from '@/lib/api'
import { Payment, Account, Category, CreditCard as CreditCardAccount } from '@/types'
import { expandRecurringPaymentOccurrences, generateRecurringDates, formatCurrency, formatDate, getMonthName, parseAsLocalDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, CreditCard, Plus, Scale, CheckCircle2, Clock, AlertCircle, Pencil, X } from 'lucide-react'
import { PaymentEvent } from './PaymentEvent'
import { PaymentForm } from '@/components/payments/PaymentForm'
import { CreditCardInvoiceDialog, CreditCardInvoiceInput } from '@/components/payments/CreditCardInvoiceDialog'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { cn } from '@/lib/utils'

function QuickDebtDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({
    name: '',
    type: 'financing' as 'financing' | 'loan',
    totalAmount: '',
    installmentAmount: '',
    totalInstallments: '',
    paidInstallments: '0',
    interestRate: '0',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    creditor: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const start = new Date()
    const end = new Date(start.getFullYear(), start.getMonth() + 12, start.getDate())
    setForm(prev => ({
      ...prev,
      startDate: new Date().toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }))
  }, [open])

  const setField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        totalAmount: Number(form.totalAmount || 0),
        installmentAmount: Number(form.installmentAmount || 0),
        totalInstallments: Number(form.totalInstallments || 0),
        paidInstallments: Number(form.paidInstallments || 0),
        interestRate: Number(form.interestRate || 0),
        remainingAmount: Number(form.totalAmount || 0),
        settlementAmount: null,
      })
      onOpenChange(false)
      setForm({
        name: '',
        type: 'financing',
        totalAmount: '',
        installmentAmount: '',
        totalInstallments: '',
        paidInstallments: '0',
        interestRate: '0',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        creditor: '',
        description: '',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova dívida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setField('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setField('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="financing">Financiamento</SelectItem>
                  <SelectItem value="loan">Empréstimo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Credor</Label>
              <Input value={form.creditor} onChange={e => setField('creditor', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor total</Label>
              <Input type="number" min="0" step="0.01" value={form.totalAmount} onChange={e => setField('totalAmount', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Parcela</Label>
              <Input type="number" min="0" step="0.01" value={form.installmentAmount} onChange={e => setField('installmentAmount', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Total de parcelas</Label>
              <Input type="number" min="1" value={form.totalInstallments} onChange={e => setField('totalInstallments', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Parcelas pagas</Label>
              <Input type="number" min="0" value={form.paidInstallments} onChange={e => setField('paidInstallments', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Juros % a.a.</Label>
              <Input type="number" min="0" step="0.01" value={form.interestRate} onChange={e => setField('interestRate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data início</Label>
              <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Data fim</Label>
              <Input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FinancialCalendar() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [creditCardInvoiceItems, setCreditCardInvoiceItems] = useState<any[]>([])
  const [incomeItems, setIncomeItems] = useState<any[]>([])
  const [debtItems, setDebtItems] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [entriesSum, setEntriesSum] = useState(0)
  const [paymentsSum, setPaymentsSum] = useState(0)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [creditCardInvoiceDialogOpen, setCreditCardInvoiceDialogOpen] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [quickCreate, setQuickCreate] = useState<'payment' | 'income' | 'debt' | null>(null)
  const [quickMenuOpen, setQuickMenuOpen] = useState(false)

  const { user } = useUser()

  useEffect(() => {
    if (!user) {
      setPayments([])
      setCreditCardInvoiceItems([])
      setLoading(false)
      return
    }
    loadPayments()
  }, [user?.id, currentDate])

  async function handleEventClick(event: any) {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  async function handleMarkAsPaid() {
    if (!selectedEvent) return
    setMarkingPaid(true)
    try {
      if (selectedEvent._type === 'creditCardInvoice') {
        const today = new Date()
        const paidDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        const due = parseAsLocalDate(selectedEvent.dueDate)
        const dueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`
        await api.updateCreditCardInvoice(selectedEvent.creditCardId, selectedEvent.invoiceId, {
          amount: Number(selectedEvent.amount),
          dueDate,
          paidDate,
          status: 'paid',
        })
      } else if (String(selectedEvent.id).includes('::')) {
        // Generated occurrence — create a DB occurrence record for this specific month
        const parts = String(selectedEvent.id).split('::')
        const baseId = parts[0]
        const dateIso = parts[1]
        await api.createPaymentOccurrence(baseId, { dueDate: dateIso, status: 'paid' })
      } else {
        // Base payment or an already-recorded occurrence
        await api.updatePayment(selectedEvent.id, { ...selectedEvent, status: 'paid' })
      }
      setDetailOpen(false)
      loadPayments()
    } finally {
      setMarkingPaid(false)
    }
  }

  async function handleMarkDebtInstallmentAsPaid() {
    if (!selectedEvent?._debt) return
    setMarkingPaid(true)
    try {
      const debt = selectedEvent._debt
      const newPaidCount = Math.max(debt.paidInstallments, selectedEvent._installmentIndex + 1)
      const newRemainingAmount = Math.max(0, debt.totalInstallments - newPaidCount) * debt.installmentAmount
      await api.updateDebt(debt.id, {
        ...debt,
        paidInstallments: newPaidCount,
        remainingAmount: newRemainingAmount,
        startDate: new Date(debt.startDate).toISOString().split('T')[0],
        endDate: new Date(debt.endDate).toISOString().split('T')[0],
      })
      setDetailOpen(false)
      loadPayments()
    } finally {
      setMarkingPaid(false)
    }
  }

  async function handleEditFromDetail() {
    setDetailOpen(false)
    if (selectedEvent?._type === 'creditCardInvoice') return
    // For income, use cached original data; for payment, load base
    if (selectedEvent?._type === 'income') {
      const txn = selectedEvent._originalData ?? selectedEvent
      setSelectedEvent({ ...txn, _type: 'income' })
    } else {
      const baseId = String(selectedEvent.id).includes('::') ? String(selectedEvent.id).split('::')[0] : selectedEvent.id
      try {
        const base = await api.getPayment(baseId)
        setSelectedEvent({ ...base, _type: 'payment' })
      } catch {
        setSelectedEvent({ ...selectedEvent, _type: 'payment' })
      }
    }
    setEditOpen(true)
  }

  async function handlePaymentSave(data: any) {
    if (selectedEvent) {
      await api.updatePayment(selectedEvent.id, data)
    }
    setEditOpen(false)
    loadPayments()
  }

  async function handleCreditCardInvoiceSave(data: CreditCardInvoiceInput) {
    if (!selectedEvent?._invoice) return
    await api.updateCreditCardInvoice(selectedEvent.creditCardId, selectedEvent.invoiceId, data)
    setCreditCardInvoiceDialogOpen(false)
    loadPayments()
  }

  async function handleCreatePayment(data: any) {
    await api.createPayment(data)
    setQuickCreate(null)
    setQuickMenuOpen(false)
    loadPayments()
  }

  async function handleCreateIncome(data: any) {
    await api.createTransaction({ ...data, type: 'income' })
    setQuickCreate(null)
    setQuickMenuOpen(false)
    loadPayments()
  }

  async function handleCreateDebt(data: any) {
    await api.createDebt({ ...data, name: data.name || 'Nova dívida' })
    setQuickCreate(null)
    setQuickMenuOpen(false)
    loadPayments()
  }

  async function handleTransactionSave(data: any) {
    if (selectedEvent) {
      const txnId = selectedEvent._originalId ?? selectedEvent.id
      await api.updateTransaction(txnId, data)
    }
    setEditOpen(false)
    loadPayments()
  }

  async function loadPayments() {
    try {
      setLoading(true)
      const [paymentsData, incomesData, accountsData, catsExpense, catsIncome, debtsData, creditCardsData] = await Promise.all([
        api.getPayments(),
        api.getTransactions({ type: 'income' }),
        api.getAccounts(),
        api.getCategories('expense'),
        api.getCategories('income'),
        api.getDebts(),
        api.getCreditCards(),
      ])
      setAccounts(accountsData || [])
      // merge and deduplicate categories by normalized name to avoid repeated options in the quick-create forms
      const allCats = [...(catsExpense || []), ...(catsIncome || [])]
      const catMap = new Map<string, Category>()
      for (const c of allCats) {
        const key = `${c.type}:${String(c.name || '').trim().toLowerCase()}`
        if (!catMap.has(key)) catMap.set(key, c)
      }
      setCategories(Array.from(catMap.values()))
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
              _originalId: t.id,
              _originalData: t,
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
            _originalId: t.id,
            _originalData: t,
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

      // Generate debt installment occurrences for calendar display
      const debtCalendarItems: any[] = []
      ;(debtsData || []).filter((d: any) => d.status !== 'settled').forEach((debt: any) => {
        const startDate = parseAsLocalDate(debt.startDate)
        const installmentDay = startDate.getDate()
        for (let i = 0; i < debt.totalInstallments; i++) {
          const installDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, installmentDay)
          const status = i < debt.paidInstallments ? 'paid' : 'pending'
          debtCalendarItems.push({
            id: `debt::${debt.id}::${i}`,
            name: debt.name + (debt.creditor ? ` · ${debt.creditor}` : ''),
            amount: debt.installmentAmount,
            dueDate: installDate,
            status,
            isRecurring: false,
            _type: 'debt',
            type: 'debt',
            _debt: debt,
            _installmentIndex: i,
            _installmentNumber: i + 1,
          })
        }
      })
      setDebtItems(debtCalendarItems)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const creditCardInvoiceCalendarItems = (creditCardsData as CreditCardAccount[]).flatMap(card =>
        card.invoices.map(invoice => {
          const dueDate = parseAsLocalDate(invoice.dueDate)
          const status = invoice.status === 'pending' && dueDate < today ? 'overdue' : invoice.status
          return {
            ...invoice,
            id: `credit-card-invoice::${invoice.id}`,
            invoiceId: invoice.id,
            creditCardId: card.id,
            creditCardName: card.name,
            _invoice: invoice,
            name: `Fatura ${card.name}`,
            status,
            dueDate,
            isRecurring: false,
            _type: 'creditCardInvoice',
          }
        }),
      )

      setPayments(expandedPayments)
      setCreditCardInvoiceItems(creditCardInvoiceCalendarItems)
      setIncomeItems(expandedIncomes)

      // compute entries sum for current month
      // compute entries sum for current month using normalized income items
      const entriesSumVal = expandedIncomes.filter((t: any) => {
        const d = parseAsLocalDate(t.dueDate)
        return d.getFullYear() === year && d.getMonth() === month
      }).reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0)
      setEntriesSum(entriesSumVal)
      // also compute payments sum for current month to use in balance/coloring (includes debts)
      const paymentsSumVal = [...expandedPayments, ...debtCalendarItems, ...creditCardInvoiceCalendarItems].filter((p: any) => {
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

  const pendingTotal = [...payments, ...debtItems, ...creditCardInvoiceItems]
    .filter(item => {
      if (item.status !== 'pending') return false
      const dueDate = parseAsLocalDate(item.dueDate)
      return dueDate.getFullYear() === year && dueDate.getMonth() === month
    })
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

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

  const goToToday = () => {
    setCurrentDate(new Date())
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
    const d = debtItems.filter((debt) => {
      const dt = parseAsLocalDate(debt.dueDate)
      return dt.getDate() === day && dt.getMonth() === month && dt.getFullYear() === year
    })
    const creditCardInvoices = creditCardInvoiceItems.filter(invoice => {
      const invoiceDate = parseAsLocalDate(invoice.dueDate)
      return invoiceDate.getDate() === day &&
        invoiceDate.getMonth() === month &&
        invoiceDate.getFullYear() === year
    })
    return [...p, ...creditCardInvoices, ...d, ...i]
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
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => setQuickMenuOpen(v => !v)}>
                  Novo +
                </Button>
                {quickMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-popover shadow-lg z-20">
                    <button
                      className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => { setQuickCreate('payment'); setQuickMenuOpen(false) }}
                    >
                      <span>Pagamento</span>
                      <CreditCard className="h-4 w-4 text-orange-500" />
                    </button>
                    <button
                      className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => { setQuickCreate('income'); setQuickMenuOpen(false) }}
                    >
                      <span>Entrada</span>
                      <Plus className="h-4 w-4 text-green-500" />
                    </button>
                    <button
                      className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => { setQuickCreate('debt'); setQuickMenuOpen(false) }}
                    >
                      <span>Dívida</span>
                      <Scale className="h-4 w-4 text-blue-500" />
                    </button>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
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
                            <PaymentEvent
                              key={payment.id}
                              payment={payment}
                              onClick={() => handleEventClick(payment)}
                            />
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
        <div className="w-full max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                        [...payments, ...debtItems]
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

            <Card>
              <CardHeader className="pb-2 min-h-12">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <CardTitle>Total Pendente</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="pl-8">
                  <div className="h-8 overflow-hidden">
                    <p className="text-xs text-muted-foreground mt-0 mb-2">
                      Dívidas e pagamentos pendentes no mês selecionado
                    </p>
                  </div>
                  <div className="border-t border-border mt-2 mb-3" />
                  <div className="mt-2">
                    <p className="text-2xl font-semibold">{formatCurrency(pendingTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Event detail mini-dialog */}
      {detailOpen && selectedEvent && (() => {
        const isInc = selectedEvent._type === 'income'
        const isDebt = selectedEvent._type === 'debt'
        const isCreditCardInvoice = selectedEvent._type === 'creditCardInvoice'
        const status = selectedEvent.status as string
        const isPaid = status === 'paid'
        const isOverdue = status === 'overdue'
        const statusLabel = isPaid ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'
        const StatusIcon = isPaid ? CheckCircle2 : isOverdue ? AlertCircle : Clock
        const statusColor = isPaid ? 'text-green-500' : isOverdue ? 'text-red-500' : 'text-amber-500'
        const statusBg = isPaid ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : isOverdue ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'

        return (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onClick={() => setDetailOpen(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div
              className="relative z-10 bg-background rounded-2xl shadow-2xl border border-border/60 w-full max-w-xs p-5"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="min-w-0">
                  <p className="font-semibold text-base truncate">{selectedEvent.name || selectedEvent.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(selectedEvent.dueDate ?? selectedEvent.date)}
                  </p>
                </div>
                <button onClick={() => setDetailOpen(false)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Amount */}
              <p className={`text-2xl font-bold mb-4 ${isInc ? 'text-green-600' : 'text-foreground'}`}>
                {isInc ? '+' : ''}{formatCurrency(selectedEvent.amount)}
              </p>

              {/* Debt installment info */}
              {isDebt && selectedEvent._debt && (
                <div className="mb-4 text-xs text-muted-foreground space-y-1">
                  <p>{selectedEvent._debt.type === 'financing' ? 'Financiamento' : 'Empréstimo'} · Parcela {selectedEvent._installmentNumber}/{selectedEvent._debt.totalInstallments}</p>
                  {selectedEvent._debt.interestRate > 0 && <p>Taxa: {selectedEvent._debt.interestRate}% a.a.</p>}
                </div>
              )}
              {isCreditCardInvoice && selectedEvent.paidDate && (
                <p className="mb-4 text-xs text-muted-foreground">
                  Pago em {formatDate(selectedEvent.paidDate)}
                </p>
              )}

              {/* Status badge */}
              {!isInc && (
                <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4', statusBg)}>
                  <StatusIcon className={cn('h-3.5 w-3.5', statusColor)} />
                  {statusLabel}
                </div>
              )}

              {/* Actions */}
              {!isDebt && (
                <div className="flex gap-2">
                  {!isInc && !isPaid && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleMarkAsPaid}
                      disabled={markingPaid}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      {markingPaid ? 'Salvando...' : 'Marcar como pago'}
                    </Button>
                  )}
                  {isCreditCardInvoice ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setDetailOpen(false)
                        setCreditCardInvoiceDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Editar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(!isInc && !isPaid ? '' : 'flex-1')}
                      onClick={handleEditFromDetail}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Editar
                    </Button>
                  )}
                </div>
              )}
              {isDebt && (
                <div className="flex gap-2">
                  {!isPaid && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleMarkDebtInstallmentAsPaid}
                      disabled={markingPaid}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      {markingPaid ? 'Salvando...' : 'Marcar como pago'}
                    </Button>
                  )}
                  {isPaid && (
                    <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Parcela paga
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {quickCreate === 'payment' && (
        <PaymentForm
          open={true}
          onOpenChange={(v) => { if (!v) setQuickCreate(null) }}
          payment={null}
          accounts={accounts}
          categories={categories.filter(c => c.type === 'expense')}
          onSubmit={handleCreatePayment}
        />
      )}
      {quickCreate === 'income' && (
        <TransactionForm
          open={true}
          onOpenChange={(v) => { if (!v) setQuickCreate(null) }}
          transaction={null}
          accounts={accounts}
          categories={categories}
          onSubmit={handleCreateIncome}
        />
      )}
      {quickCreate === 'debt' && (
        <QuickDebtDialog
          open={true}
          onOpenChange={(v) => { if (!v) setQuickCreate(null) }}
          onSubmit={handleCreateDebt}
        />
      )}

      {/* Edit forms — only mount when editOpen to avoid useEffect crashes on proxy calendar objects */}
      {selectedEvent?._type === 'payment' && editOpen && (
        <PaymentForm
          open={editOpen}
          onOpenChange={(v) => { setEditOpen(v); if (!v) setSelectedEvent(null) }}
          payment={selectedEvent}
          accounts={accounts}
          categories={categories.filter(c => c.type === 'expense')}
          onSubmit={handlePaymentSave}
          onDelete={async (id) => { await api.deletePayment(id); setEditOpen(false); setSelectedEvent(null); loadPayments() }}
        />
      )}
      {selectedEvent?._type === 'income' && editOpen && (
        <TransactionForm
          open={editOpen}
          onOpenChange={(v) => { setEditOpen(v); if (!v) setSelectedEvent(null) }}
          transaction={selectedEvent}
          accounts={accounts}
          categories={categories}
          onSubmit={handleTransactionSave}
        />
      )}
      {selectedEvent?._type === 'creditCardInvoice' && (
        <CreditCardInvoiceDialog
          open={creditCardInvoiceDialogOpen}
          onOpenChange={setCreditCardInvoiceDialogOpen}
          cardName={selectedEvent.creditCardName}
          invoice={selectedEvent._invoice}
          onSubmit={handleCreditCardInvoiceSave}
        />
      )}
    </div>
  )
}