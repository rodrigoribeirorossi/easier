import { useState, useEffect } from 'react'
import useUser from '@/hooks/useUser'
import { api } from '@/lib/api'
import { Debt } from '@/types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus, Pencil, Trash2, TrendingDown, Landmark, HandCoins, CalendarClock,
  AlertCircle, CheckCircle2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

// ─── helpers ──────────────────────────────────────────────────────────────────
function progressPercent(debt: Debt) {
  return Math.min(100, Math.round((debt.paidInstallments / debt.totalInstallments) * 100))
}

function monthsRemaining(debt: Debt) {
  return Math.max(0, debt.totalInstallments - debt.paidInstallments)
}

function buildChartData(debts: Debt[]) {
  if (!debts.length) return []

  const today = new Date()
  // Find the furthest end date
  const maxEnd = debts.reduce((acc, d) => {
    const e = new Date(d.endDate)
    return e > acc ? e : acc
  }, today)

  const months: { label: string; total: number; financing: number; loan: number }[] = []
  const cur = new Date(today.getFullYear(), today.getMonth(), 1)

  while (cur <= maxEnd) {
    const label = cur.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    let financing = 0
    let loan = 0

    debts.forEach(debt => {
      const end = new Date(debt.endDate)
      if (cur <= end) {
        const paid = Math.min(
          debt.paidInstallments + Math.round(
            (cur.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
          ),
          debt.totalInstallments
        )
        const remaining = Math.max(0, debt.totalInstallments - paid) * debt.installmentAmount
        if (debt.type === 'financing') financing += remaining
        else loan += remaining
      }
    })

    months.push({ label, total: financing + loan, financing, loan })
    cur.setMonth(cur.getMonth() + 1)
  }

  return months
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '',
  type: 'financing' as 'financing' | 'loan',
  totalAmount: '',
  remainingAmount: '',
  settlementAmount: '',
  installmentAmount: '',
  totalInstallments: '',
  paidInstallments: '0',
  interestRate: '0',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  description: '',
  creditor: '',
}

function DebtForm({
  open, onOpenChange, debt, onSubmit, onSettle,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  debt?: Debt | null
  onSubmit: (data: any) => Promise<void>
  onSettle?: () => void
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (debt) {
      setForm({
        name: debt.name,
        type: debt.type,
        totalAmount: String(debt.totalAmount),
        remainingAmount: String(debt.remainingAmount),
        settlementAmount: debt.settlementAmount != null ? String(debt.settlementAmount) : '',
        installmentAmount: String(debt.installmentAmount),
        totalInstallments: String(debt.totalInstallments),
        paidInstallments: String(debt.paidInstallments),
        interestRate: String(debt.interestRate),
        startDate: new Date(debt.startDate).toISOString().split('T')[0],
        endDate: new Date(debt.endDate).toISOString().split('T')[0],
        description: debt.description ?? '',
        creditor: debt.creditor ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, debt])

  // Auto-compute end date when totalInstallments or startDate change (monthly)
  useEffect(() => {
    if (!form.startDate || !form.totalInstallments) return
    const n = parseInt(form.totalInstallments)
    const paid = parseInt(form.paidInstallments || '0')
    if (isNaN(n) || n <= 0) return
    const start = new Date(form.startDate)
    start.setMonth(start.getMonth() + n)
    setForm(f => ({ ...f, endDate: start.toISOString().split('T')[0] }))
    // auto remaining amount
    if (form.installmentAmount) {
      const inst = parseFloat(form.installmentAmount)
      const remaining = (n - paid) * inst
      if (!isNaN(remaining)) setForm(f => ({ ...f, remainingAmount: String(remaining.toFixed(2)) }))
    }
  }, [form.totalInstallments, form.startDate, form.installmentAmount, form.paidInstallments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        totalAmount: parseFloat(form.totalAmount),
        remainingAmount: parseFloat(form.remainingAmount || form.totalAmount),
        settlementAmount: form.settlementAmount !== '' ? parseFloat(form.settlementAmount) : null,
        installmentAmount: parseFloat(form.installmentAmount),
        totalInstallments: parseInt(form.totalInstallments),
        paidInstallments: parseInt(form.paidInstallments || '0'),
        interestRate: parseFloat(form.interestRate || '0'),
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{debt ? 'Editar dívida' : 'Nova dívida'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Ex: Financiamento Apartamento" value={form.name} onChange={set('name')} required />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="financing">Financiamento</SelectItem>
                  <SelectItem value="loan">Empréstimo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Credor</Label>
              <Input placeholder="Ex: Caixa Econômica" value={form.creditor} onChange={set('creditor')} />
            </div>

            <div className="space-y-1.5">
              <Label>Valor total (R$)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0,00" value={form.totalAmount} onChange={set('totalAmount')} required />
            </div>

            <div className="space-y-1.5">
              <Label>Valor da parcela (R$)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0,00" value={form.installmentAmount} onChange={set('installmentAmount')} required />
            </div>

            <div className="space-y-1.5">
              <Label>Total de parcelas</Label>
              <Input type="number" min="1" placeholder="Ex: 360" value={form.totalInstallments} onChange={set('totalInstallments')} required />
            </div>

            <div className="space-y-1.5">
              <Label>Parcelas pagas</Label>
              <Input type="number" min="0" placeholder="0" value={form.paidInstallments} onChange={set('paidInstallments')} />
            </div>

            <div className="space-y-1.5">
              <Label>Taxa de juros (% a.a.)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0,00" value={form.interestRate} onChange={set('interestRate')} />
            </div>

            <div className="space-y-1.5">
              <Label>Saldo devedor (R$)</Label>
              <Input type="number" min="0" step="0.01" placeholder="Calculado automaticamente" value={form.remainingAmount} onChange={set('remainingAmount')} />
            </div>

            <div className="space-y-1.5">
              <Label>Valor de Quitação Atual (R$)</Label>
              <Input type="number" min="0" step="0.01" placeholder="Valor para quitar agora (opcional)" value={form.settlementAmount} onChange={set('settlementAmount')} />
            </div>

            <div className="space-y-1.5">
              <Label>Data de início</Label>
              <Input type="date" value={form.startDate} onChange={set('startDate')} required />
            </div>

            <div className="space-y-1.5">
              <Label>Data de término</Label>
              <Input type="date" value={form.endDate} onChange={set('endDate')} required />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input placeholder="Detalhes adicionais" value={form.description} onChange={set('description')} />
            </div>
          </div>

          <DialogFooter>
            {debt && onSettle && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => { onOpenChange(false); onSettle() }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Quitar dívida
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Settle Dialog ────────────────────────────────────────────────────────────
function SettleDialog({
  open, onOpenChange, debt, onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  debt?: Debt | null
  onConfirm: (settledAt: string, paymentIds: string[]) => Promise<void>
}) {
  const [settledAt, setSettledAt] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingPayments, setLoadingPayments] = useState(false)

  useEffect(() => {
    if (!open) return
    setSettledAt(new Date().toISOString().split('T')[0])
    setSelectedIds(new Set())
    // Load all payments so user can pick which to cancel
    setLoadingPayments(true)
    api.getPayments().then((data: any[]) => {
      // Show recurring payments + pending/overdue non-recurring
      const relevant = (data || []).filter(
        (p: any) => p.isRecurring || ['pending', 'overdue'].includes(p.status)
      )
      setPayments(relevant)
      // Pre-select payments whose name contains the debt name or creditor (case-insensitive)
      if (debt) {
        const norm = (s: string) => s.trim().toLowerCase()
        const debtName = norm(debt.name)
        const creditor = debt.creditor ? norm(debt.creditor) : ''
        const pre = new Set<string>()
        relevant.forEach((p: any) => {
          const pName = norm(p.name)
          if (
            pName === debtName ||
            pName.includes(debtName) || debtName.includes(pName) ||
            (creditor && (pName.includes(creditor) || creditor.includes(pName)))
          ) {
            pre.add(p.id)
          }
        })
        setSelectedIds(pre)
      }
    }).finally(() => setLoadingPayments(false))
  }, [open, debt])

  function togglePayment(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleConfirm() {
    setLoading(true)
    try { await onConfirm(settledAt, Array.from(selectedIds)) } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Quitar dívida
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Confirme a quitação de <strong>{debt?.name}</strong>.
          </p>
          <div className="space-y-1.5">
            <Label>Data de quitação</Label>
            <Input
              type="date"
              value={settledAt}
              onChange={e => setSettledAt(e.target.value)}
              required
            />
          </div>

          {/* Payment selection */}
          <div className="space-y-1.5">
            <Label>Pagamentos a cancelar do calendário</Label>
            <p className="text-xs text-muted-foreground">Selecione os pagamentos recorrentes ou futuros que devem ser removidos ao quitar esta dívida.</p>
            {loadingPayments ? (
              <div className="h-16 bg-muted animate-pulse rounded" />
            ) : payments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum pagamento encontrado.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {payments.map((p: any) => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/40 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedIds.has(p.id)}
                      onChange={() => togglePayment(p.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(p.amount)} · {p.isRecurring ? 'Recorrente' : formatDate(p.dueDate)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading || !settledAt}
            onClick={handleConfirm}
          >
            {loading ? 'Quitando...' : 'Confirmar quitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Debt Card Row ─────────────────────────────────────────────────────────────
function DebtRow({ debt, onEdit, onDelete, onSettle }: { debt: Debt; onEdit: () => void; onDelete: () => void; onSettle?: () => void }) {
  const pct = progressPercent(debt)
  const remaining = monthsRemaining(debt)
  const isAlmostDone = pct >= 75
  const isOverdue = new Date(debt.endDate) < new Date()

  const nextInstallmentDate = new Date(debt.startDate)
  nextInstallmentDate.setMonth(nextInstallmentDate.getMonth() + debt.paidInstallments)

  const nextInstallmentStatus = nextInstallmentDate > new Date() ? 'em dia' : 'atrasado'
  const nextInstallmentStatusColor = nextInstallmentDate > new Date() ? 'text-green-600' : 'text-red-600'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/40 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{debt.name}</span>
          {debt.creditor && <span className="text-xs text-muted-foreground">· {debt.creditor}</span>}
          {isOverdue && (
            <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
              <AlertCircle className="h-3 w-3" /> Vencido
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          <span>{debt.paidInstallments}/{debt.totalInstallments} parcelas</span>
          <span>·</span>
          <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />{remaining} restantes</span>
          <span>·</span>
          <span>Vencimento: {formatDate(nextInstallmentDate)}</span>
          <span>·</span>
          <span>
            Status: <span className={nextInstallmentStatusColor}>{nextInstallmentStatus}</span>
          </span>
          <span>·</span>
          <span>até {formatDate(debt.endDate)}</span>
          {debt.interestRate > 0 && <><span>·</span><span>{debt.interestRate}% a.a.</span></>}
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden w-full max-w-xs">
          <div
            className={cn('h-full rounded-full transition-all', isAlmostDone ? 'bg-green-500' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground mt-0.5 block">{pct}% quitado</span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Parcela</p>
          <p className="font-semibold text-sm">{formatCurrency(debt.installmentAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Saldo devedor</p>
          <p className="font-semibold text-sm text-red-500">{formatCurrency(debt.remainingAmount)}</p>
        </div>        {debt.settlementAmount != null && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Quitação atual</p>
            <p className="font-semibold text-sm text-amber-500">{formatCurrency(debt.settlementAmount)}</p>
          </div>
        )}        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onSettle && (
            <Button variant="ghost" size="icon" title="Quitar dívida" onClick={onSettle}>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
        </div>
      </div>
    </div>
  )
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function DebtPage() {
  const { user } = useUser()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [settleTarget, setSettleTarget] = useState<Debt | null>(null)
  const [settleOpen, setSettleOpen] = useState(false)
  const [loanTab, setLoanTab] = useState<'active' | 'settled'>('active')
  const [financingTab, setFinancingTab] = useState<'active' | 'settled'>('active')

  useEffect(() => {
    if (!user?.id) return
    loadDebts()
  }, [user?.id])

  async function loadDebts() {
    setLoading(true)
    try {
      const data = await api.getDebts()
      setDebts(data || [])
    } catch {
      setDebts([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: any) {
    if (editing) {
      await api.updateDebt(editing.id, data)
    } else {
      await api.createDebt(data)
    }
    setEditing(null)
    loadDebts()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta dívida?')) return
    await api.deleteDebt(id)
    loadDebts()
  }

  function openEdit(debt: Debt) {
    setEditing(debt)
    setFormOpen(true)
  }

  function openSettle(debt: Debt) {
    setSettleTarget(debt)
    setSettleOpen(true)
  }

  async function handleSettle(settledAt: string, paymentIds: string[]) {
    if (!settleTarget) return
    await api.settleDebt(settleTarget.id, settledAt, paymentIds)
    setSettleOpen(false)
    setSettleTarget(null)
    loadDebts()
  }

  const activeDebts = debts.filter(d => !d.status || d.status === 'active')
  const financings = debts.filter(d => d.type === 'financing')
  const activeFinancings = financings.filter(d => !d.status || d.status === 'active')
  const settledFinancings = financings.filter(d => d.status === 'settled')
  const loans = debts.filter(d => d.type === 'loan')
  const activeLoans = loans.filter(d => !d.status || d.status === 'active')
  const settledLoans = loans.filter(d => d.status === 'settled')

  const totalremaining = activeDebts.reduce((s, d) => s + d.remainingAmount, 0)
  const totalInstallments = activeDebts.reduce((s, d) => s + d.installmentAmount, 0)
  const totalSettlement = activeDebts.filter(d => d.settlementAmount != null).reduce((s, d) => s + (d.settlementAmount ?? 0), 0)
  const hasSettlement = activeDebts.some(d => d.settlementAmount != null)
  const chartData = buildChartData(activeDebts)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Dívidas</h2>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova dívida
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className={cn('grid grid-cols-1 gap-4', hasSettlement ? 'sm:grid-cols-4' : 'sm:grid-cols-3')}>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo devedor total</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(totalremaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <HandCoins className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Parcelas do mês</p>
                <p className="text-xl font-bold">{formatCurrency(totalInstallments)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de dívidas</p>
                <p className="text-xl font-bold">{activeDebts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {hasSettlement && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <HandCoins className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quitação total agora</p>
                  <p className="text-xl font-bold text-amber-500">{formatCurrency(totalSettlement)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Financiamentos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <CardTitle>Financiamentos</CardTitle>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{activeFinancings.length}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={financingTab} onValueChange={v => setFinancingTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">Ativos ({activeFinancings.length})</TabsTrigger>
              <TabsTrigger value="settled">Encerrados ({settledFinancings.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {activeFinancings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <Landmark className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Nenhum financiamento ativo</p>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar financiamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeFinancings.map(d => (
                    <DebtRow key={d.id} debt={d} onEdit={() => openEdit(d)} onDelete={() => handleDelete(d.id)} onSettle={() => openSettle(d)} />
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                    <span className="text-muted-foreground">Total financiamentos ativos</span>
                    <span className="font-semibold text-red-500">{formatCurrency(activeFinancings.reduce((s, d) => s + d.remainingAmount, 0))}</span>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="settled">
              {settledFinancings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <CheckCircle2 className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Nenhum financiamento encerrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settledFinancings.map(d => (
                    <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border bg-muted/30 opacity-75">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{d.name}</span>
                          {d.creditor && <span className="text-xs text-muted-foreground">· {d.creditor}</span>}
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Quitado
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {d.settledAt ? `Quitado em ${formatDate(d.settledAt)}` : `Encerrado em ${formatDate(d.endDate)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Valor total</p>
                        <p className="font-semibold text-sm">{formatCurrency(d.totalAmount)}</p>
                      </div>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Empréstimos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-orange-500" />
              <CardTitle>Empréstimos</CardTitle>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{activeLoans.length}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={loanTab} onValueChange={v => setLoanTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">Ativos ({activeLoans.length})</TabsTrigger>
              <TabsTrigger value="settled">Encerrados ({settledLoans.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {activeLoans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <HandCoins className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Nenhum empréstimo ativo</p>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar empréstimo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map(d => (
                    <DebtRow key={d.id} debt={d} onEdit={() => openEdit(d)} onDelete={() => handleDelete(d.id)} onSettle={() => openSettle(d)} />
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                    <span className="text-muted-foreground">Total empréstimos ativos</span>
                    <span className="font-semibold text-red-500">{formatCurrency(activeLoans.reduce((s, d) => s + d.remainingAmount, 0))}</span>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="settled">
              {settledLoans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <CheckCircle2 className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Nenhum empréstimo encerrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settledLoans.map(d => (
                    <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border bg-muted/30 opacity-75">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{d.name}</span>
                          {d.creditor && <span className="text-xs text-muted-foreground">· {d.creditor}</span>}
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Quitado
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {d.settledAt ? `Quitado em ${formatDate(d.settledAt)}` : `Encerrado em ${formatDate(d.endDate)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Valor total</p>
                        <p className="font-semibold text-sm">{formatCurrency(d.totalAmount)}</p>
                      </div>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Consolidado */}
      {activeDebts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Consolidado — Evolução das Dívidas</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Projeção do saldo devedor ao longo do tempo até a quitação total
            </p>
          </CardHeader>
          <CardContent>
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Saldo devedor', value: formatCurrency(totalremaining), color: 'text-red-500' },
                { label: 'Financiamentos', value: formatCurrency(activeFinancings.reduce((s, d) => s + d.remainingAmount, 0)), color: 'text-primary' },
                { label: 'Empréstimos', value: formatCurrency(activeLoans.reduce((s, d) => s + d.remainingAmount, 0)), color: 'text-orange-500' },
                { label: 'Parcelas/mês', value: formatCurrency(totalInstallments), color: 'text-foreground' },
                ...(hasSettlement ? [{ label: 'Quitação total agora', value: formatCurrency(totalSettlement), color: 'text-amber-500' }] : []),
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={cn('text-lg font-bold', item.color)}>{item.value}</p>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradFinancing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradLoan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  width={55}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
                {activeFinancings.length > 0 && (
                  <Area
                    type="monotone"
                    dataKey="financing"
                    name="Financiamentos"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#gradFinancing)"
                    dot={false}
                  />
                )}
                {activeLoans.length > 0 && (
                  <Area
                    type="monotone"
                    dataKey="loan"
                    name="Empréstimos"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#gradLoan)"
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <DebtForm
        open={formOpen}
        onOpenChange={v => { setFormOpen(v); if (!v) setEditing(null) }}
        debt={editing}
        onSubmit={handleSubmit}
        onSettle={editing ? () => openSettle(editing) : undefined}
      />

      <SettleDialog
        open={settleOpen}
        onOpenChange={v => { setSettleOpen(v); if (!v) setSettleTarget(null) }}
        debt={settleTarget}
        onConfirm={handleSettle}
      />
    </div>
  )
}
