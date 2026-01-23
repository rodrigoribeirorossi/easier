import { useState, useEffect } from 'react'
import useUser from '@/hooks/useUser'
import { api } from '@/lib/api'
import { Transaction, Account, Category } from '@/types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Edit, Trash2 } from 'lucide-react'
import { TransactionFilters } from './TransactionFilters'
import { TransactionForm } from './TransactionForm'

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [filters, setFilters] = useState({
    type: 'all',
    category: '',
    startDate: '',
    endDate: '',
    search: '',
  })

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
  }, [user && user.id, filters])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [txs, accs, cats] = await Promise.all([
        api.getTransactions(buildQueryParams()),
        api.getAccounts(),
        api.getCategories(),
      ])
      setTransactions(txs)
      setAccounts(accs)
      setCategories(cats)
    } catch (error) {
      console.error('Failed to load transactions:', error)
      try { setError((error as Error).message || 'Failed to load transactions') } catch { setError('Failed to load transactions') }
    } finally {
      setLoading(false)
    }
  }

  function buildQueryParams() {
    const params: any = {}
    if (filters.type && filters.type !== 'all') params.type = filters.type
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    return params
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.category && transaction.category?.name !== filters.category) {
      return false
    }
    if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
      return false
    }
    return true
  })

  async function handleSubmit(data: any) {
    if (selectedTransaction) {
      await api.updateTransaction(selectedTransaction.id, data)
    } else {
      await api.createTransaction(data)
    }
    loadData()
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await api.deleteTransaction(id)
      loadData()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpCircle className="h-5 w-5 text-green-600" />
      case 'expense':
        return <ArrowDownCircle className="h-5 w-5 text-red-600" />
      default:
        return <ArrowRightLeft className="h-5 w-5 text-blue-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'Receita'
      case 'expense':
        return 'Despesa'
      default:
        return 'Transferência'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Transações</h2>
        <Button onClick={() => { setSelectedTransaction(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <TransactionFilters
        filters={filters}
        onFilterChange={setFilters}
        onClear={() => setFilters({ type: 'all', category: '', startDate: '', endDate: '', search: '' })}
      />

      <Card>
        <CardHeader>
          <CardTitle>Todas as Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : loading ? (
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
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada</p>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getTypeIcon(transaction.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{transaction.description}</p>
                        <Badge variant="outline" className="text-xs">{getTypeLabel(transaction.type)}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <span>{transaction.category.name}</span>
                          </>
                        )}
                        {transaction.account && (
                          <>
                            <span>•</span>
                            <span>{transaction.account.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' :
                      transaction.type === 'expense' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'} {formatCurrency(transaction.amount)}
                    </span>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedTransaction(transaction); setDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
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
