import { useEffect, useState } from 'react'
import { Account, CreditCard, CreditCardInvoice } from '@/types'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, parseAsLocalDate } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard as CreditCardIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { CreditCardDialog } from './CreditCardDialog'
import { CreditCardInvoiceDialog, CreditCardInvoiceInput } from './CreditCardInvoiceDialog'

interface CreditCardSectionProps {
  accounts: Account[]
  cards: CreditCard[]
  loading: boolean
  onRefresh: () => Promise<void>
}

function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getDueMonth(value: string | Date) {
  const date = parseAsLocalDate(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatInvoiceMonth(value: string | Date) {
  const date = parseAsLocalDate(value)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(date)
}

function getInvoiceStatus(invoice: CreditCardInvoice) {
  if (invoice.status === 'paid') {
    return { label: 'Paga', className: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300' }
  }

  const dueDate = parseAsLocalDate(invoice.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (dueDate < today) {
    return { label: 'Atrasada', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300' }
  }

  return { label: 'Pendente', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300' }
}

export function CreditCardSection({ accounts, cards, loading, onRefresh }: CreditCardSectionProps) {
  const [activeAccountId, setActiveAccountId] = useState('')
  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [cardFormAccountId, setCardFormAccountId] = useState('')
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceFormCardId, setInvoiceFormCardId] = useState('')
  const [editingInvoice, setEditingInvoice] = useState<CreditCardInvoice | null>(null)

  useEffect(() => {
    if (accounts.length > 0 && !accounts.some(account => account.id === activeAccountId)) {
      setActiveAccountId(accounts[0].id)
    }
  }, [accounts, activeAccountId])

  const activeAccount = accounts.find(account => account.id === activeAccountId) ?? accounts[0]
  const currentMonth = getCurrentMonthKey()
  const invoiceFormCard = cards.find(card => card.id === invoiceFormCardId)
  const cardFormAccount = accounts.find(account => account.id === cardFormAccountId)

  function openCardDialog(account: Account, card?: CreditCard) {
    setCardFormAccountId(account.id)
    setEditingCard(card ?? null)
    setCardDialogOpen(true)
  }

  function openInvoiceDialog(card: CreditCard, invoice?: CreditCardInvoice) {
    setInvoiceFormCardId(card.id)
    setEditingInvoice(invoice ?? null)
    setInvoiceDialogOpen(true)
  }

  async function handleCardSubmit(data: { name: string }) {
    if (editingCard) {
      await api.updateCreditCard(editingCard.id, data)
    } else {
      await api.createCreditCard({ ...data, accountId: cardFormAccountId })
    }
    await onRefresh()
  }

  async function handleInvoiceSubmit(data: CreditCardInvoiceInput) {
    if (!invoiceFormCard) throw new Error('Cartão não encontrado.')
    if (editingInvoice) {
      await api.updateCreditCardInvoice(invoiceFormCard.id, editingInvoice.id, data)
    } else {
      await api.createCreditCardInvoice(invoiceFormCard.id, data)
    }
    await onRefresh()
  }

  async function handleDeleteInvoice(card: CreditCard, invoice: CreditCardInvoice) {
    if (!confirm(`Excluir a fatura com vencimento em ${formatDate(invoice.dueDate)}?`)) return
    try {
      await api.deleteCreditCardInvoice(card.id, invoice.id)
      await onRefresh()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Não foi possível excluir a fatura.')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cartões de Crédito</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          ) : accounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cadastre uma conta para associar um cartão de crédito.
            </p>
          ) : activeAccount ? (
            <Tabs value={activeAccount.id} onValueChange={setActiveAccountId} orientation="vertical">
              <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
                <TabsList
                  aria-label="Contas associadas a cartões de crédito"
                  className="h-auto w-full flex-col items-stretch justify-start gap-1 bg-transparent p-0"
                >
                  {accounts.map(account => (
                    <TabsTrigger
                      key={account.id}
                      value={account.id}
                      className="w-full justify-start px-3 py-3 text-left data-[state=active]:bg-muted"
                    >
                      <span className="truncate">{account.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="min-w-0">
                  {accounts.map(account => {
                    const card = cards.find(item => item.accountId === account.id) ?? null
                    const monthInvoice = card?.invoices.find(invoice => getDueMonth(invoice.dueDate) === currentMonth)
                    const invoices = [...(card?.invoices ?? [])]
                      .sort((a, b) => parseAsLocalDate(b.dueDate).getTime() - parseAsLocalDate(a.dueDate).getTime())
                    const dueMonthCounts = new Map<string, number>()
                    for (const invoice of invoices) {
                      const dueMonth = getDueMonth(invoice.dueDate)
                      dueMonthCounts.set(dueMonth, (dueMonthCounts.get(dueMonth) ?? 0) + 1)
                    }
                    const history = (card?.invoices ?? [])
                      .filter(invoice => invoice.status === 'paid')
                      .sort((a, b) => parseAsLocalDate(b.dueDate).getTime() - parseAsLocalDate(a.dueDate).getTime())
                      .slice(0, 4)

                    return (
                      <TabsContent key={account.id} value={account.id} className="mt-0">
                        {!card ? (
                          <div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 text-center">
                            <CreditCardIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <div>
                              <p className="font-medium">Sem cartão de crédito</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Associe um cartão à conta {account.name} para acompanhar as faturas.
                              </p>
                            </div>
                            <Button onClick={() => openCardDialog(account)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar cartão
                            </Button>
                          </div>
                        ) : (
                          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(270px,0.9fr)]">
                            <section className="rounded-lg border border-border p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <CreditCardIcon className="h-6 w-6" aria-hidden="true" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold">Cartão {card.name}</p>
                                    <p className="text-sm text-muted-foreground">{formatInvoiceMonth(new Date())}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => openCardDialog(account, card)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar cartão
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => openInvoiceDialog(card)}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova fatura
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white/75">Cartão de crédito</span>
                                  <CreditCardIcon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <p className="mt-6 truncate text-lg font-semibold">Cartão {card.name}</p>
                                <p className="mt-1 text-xs text-white/65">{account.name}</p>
                              </div>

                              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">Fatura do mês</p>
                                  <p className="mt-1 text-2xl font-bold">
                                    {monthInvoice ? formatCurrency(monthInvoice.amount) : '—'}
                                  </p>
                                  {monthInvoice && (
                                    <Badge variant="outline" className={`mt-2 ${getInvoiceStatus(monthInvoice).className}`}>
                                      {getInvoiceStatus(monthInvoice).label}
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">Vencimento</span>
                                    <span className="font-medium">{monthInvoice ? formatDate(monthInvoice.dueDate) : '—'}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">Pagamento</span>
                                    <span className="font-medium">
                                      {monthInvoice?.paidDate ? formatDate(monthInvoice.paidDate) : '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </section>

                            <div className="space-y-4">
                            <section className="rounded-lg border border-border p-4">
                              <div className="mb-4">
                                <h4 className="font-semibold">Visão geral</h4>
                                <p className="text-xs text-muted-foreground">
                                  {invoices.length} {invoices.length === 1 ? 'fatura cadastrada' : 'faturas cadastradas'}
                                  {' · '}
                                  {formatCurrency(invoices
                                    .filter(invoice => invoice.status !== 'paid')
                                    .reduce((total, invoice) => total + Number(invoice.amount), 0))} pendentes
                                </p>
                              </div>
                              {invoices.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                  Nenhuma fatura cadastrada.
                                </p>
                              ) : (
                                <ul className="max-h-64 divide-y divide-border overflow-y-auto">
                                  {invoices.map(invoice => {
                                    const duplicateDueMonth = (dueMonthCounts.get(getDueMonth(invoice.dueDate)) ?? 0) > 1
                                    const status = getInvoiceStatus(invoice)
                                    return (
                                      <li key={invoice.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium">{formatInvoiceMonth(invoice.dueDate)}</p>
                                          <p className="text-xs text-muted-foreground">Vencimento: {formatDate(invoice.dueDate)}</p>
                                          <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className={status.className}>{status.label}</Badge>
                                            {duplicateDueMonth && (
                                              <span className="text-xs font-medium text-destructive">
                                                Outra fatura neste mês
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                          <span className="text-sm font-semibold">{formatCurrency(invoice.amount)}</span>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Editar fatura com vencimento em ${formatDate(invoice.dueDate)}`}
                                            onClick={() => openInvoiceDialog(card, invoice)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Excluir fatura com vencimento em ${formatDate(invoice.dueDate)}`}
                                            onClick={() => handleDeleteInvoice(card, invoice)}
                                          >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                          </Button>
                                        </div>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                            </section>

                            <section className="rounded-lg border border-border p-4">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  <h4 className="font-semibold">Faturas pagas</h4>
                                  <p className="text-xs text-muted-foreground">Últimos meses</p>
                                </div>
                              </div>
                              {history.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                  Nenhuma fatura paga registrada.
                                </p>
                              ) : (
                                <ul className="divide-y divide-border">
                                  {history.map(invoice => (
                                    <li key={invoice.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{formatInvoiceMonth(invoice.dueDate)}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Pago em {invoice.paidDate ? formatDate(invoice.paidDate) : '—'} · Venceu em {formatDate(invoice.dueDate)}
                                        </p>
                                      </div>
                                      <span className="shrink-0 text-sm font-semibold">{formatCurrency(invoice.amount)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </section>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    )
                  })}
                </div>
              </div>
            </Tabs>
          ) : null}
        </CardContent>
      </Card>

      {cardFormAccount && (
        <CreditCardDialog
          open={cardDialogOpen}
          onOpenChange={setCardDialogOpen}
          account={cardFormAccount}
          card={editingCard}
          onSubmit={handleCardSubmit}
        />
      )}
      {invoiceFormCard && (
        <CreditCardInvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          cardName={invoiceFormCard.name}
          invoice={editingInvoice}
          onSubmit={handleInvoiceSubmit}
        />
      )}
    </>
  )
}
