import { FormEvent, useEffect, useState } from 'react'
import { CreditCardInvoice } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface CreditCardInvoiceInput {
  amount: number
  dueDate: string
  paidDate: string | null
  status: 'pending' | 'paid'
}

interface CreditCardInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardName: string
  invoice?: CreditCardInvoice | null
  onSubmit: (data: CreditCardInvoiceInput) => Promise<void>
}

function localDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateInputValue(value?: string | Date | null) {
  if (!value) return ''
  return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10)
}

export function CreditCardInvoiceDialog({
  open,
  onOpenChange,
  cardName,
  invoice,
  onSubmit,
}: CreditCardInvoiceDialogProps) {
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const [status, setStatus] = useState<'pending' | 'paid'>('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (invoice) {
      setAmount(String(invoice.amount))
      setDueDate(dateInputValue(invoice.dueDate))
      setPaidDate(dateInputValue(invoice.paidDate))
      setStatus(invoice.status)
    } else {
      setAmount('')
      setDueDate('')
      setPaidDate('')
      setStatus('pending')
    }
    setError(null)
  }, [invoice, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        amount: Number(amount),
        dueDate,
        paidDate: status === 'paid' ? paidDate : null,
        status,
      })
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar a fatura.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{invoice ? 'Editar fatura' : 'Cadastrar fatura'}</DialogTitle>
          <DialogDescription>Informe o valor e a data de vencimento da fatura do cartão {cardName}. A data será exibida no Calendário.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-amount">Valor da fatura (R$)</Label>
            <Input
              id="invoice-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoice-due-date">Vencimento</Label>
              <Input
                id="invoice-due-date"
                type="date"
                value={dueDate}
                onChange={event => setDueDate(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value: 'pending' | 'paid') => {
                  setStatus(value)
                  setPaidDate(value === 'paid' ? current => current || localDateInput(new Date()) : '')
                }}
              >
                <SelectTrigger id="invoice-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {status === 'paid' && (
            <div className="space-y-2">
              <Label htmlFor="invoice-paid-date">Data do pagamento</Label>
              <Input
                id="invoice-paid-date"
                type="date"
                value={paidDate}
                onChange={event => setPaidDate(event.target.value)}
                required
              />
            </div>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar fatura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
