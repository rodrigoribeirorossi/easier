import { FormEvent, useEffect, useState } from 'react'
import { Account, CreditCard } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreditCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account
  card?: CreditCard | null
  onSubmit: (data: { name: string }) => Promise<void>
}

export function CreditCardDialog({ open, onOpenChange, account, card, onSubmit }: CreditCardDialogProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(card?.name ?? account.name)
    setError(null)
  }, [account, card, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim() })
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o cartão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card ? 'Editar cartão de crédito' : 'Adicionar cartão de crédito'}</DialogTitle>
          <DialogDescription>Este cartão ficará associado à conta “{account.name}”.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credit-card-name">Nome do cartão</Label>
            <Input
              id="credit-card-name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Ex.: Nubank Platinum"
              maxLength={80}
              required
            />
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar cartão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
