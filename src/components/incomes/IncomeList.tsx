import { useState, useEffect } from 'react'
import useUser from '@/hooks/useUser'
import { api } from '@/lib/api'
import { Transaction, Account, Category } from '@/types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowUpCircle, Edit, Trash2 } from 'lucide-react'
import { TransactionForm } from '@/components/transactions/TransactionForm'

export function IncomeList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const { user } = useUser()

  useEffect(() => {
    if (!user) {
      setTransactions([])
      setAccounts([])
      setCategories([])
      setLoading(false)
      return
    }
    loadData()
  }, [user && user.id])

  async function loadData() {
    try {
      setLoading(true)
      const [txs, accs, cats] = await Promise.all([
        api.getTransactions({ type: 'income' }),
        api.getAccounts(),
        api.getCategories('income'),
      ])
      setTransactions(txs)
      setAccounts(accs)
      setCategories(cats)
    } catch (error) {
      console.error('Failed to load incomes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: any) {
    if (selectedTransaction) {
      await api.updateTransaction(selectedTransaction.id, data)
    } else {
      await api.createTransaction({ ...data, type: 'income' })
    }
    loadData()
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir esta entrada?')) {
      await api.deleteTransaction(id)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Entradas</h2>
        <Button onClick={() => { setSelectedTransaction(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrada
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Entradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma entrada encontrada</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tx.description}</p>
                        <Badge variant="outline" className="text-xs">Receita</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{formatDate(tx.date)}</span>
                        {tx.category && (
                          <>
                            <span>•</span>
                            <span>{tx.category.name}</span>
                          </>
                        )}
                        {tx.account && (
                          <>
                            <span>•</span>
                            <span>{tx.account.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-green-600">+ {formatCurrency(tx.amount)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedTransaction(tx); setDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
        accounts={accounts}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
