const API_BASE_URL = (typeof window !== 'undefined' && window.location && window.location.origin)
  ? `${window.location.origin}/api`
  : 'http://localhost:3001/api'

async function request(path: string, options: RequestInit = {}) {
  const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('easier_user') : null
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('easier_token') : null
  const userId = storedUser ? (JSON.parse(storedUser) as any).id : null

  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  else if (userId) headers.set('x-user-id', userId)
  if (!(options.method && options.method.toUpperCase() === 'GET') && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // If there's no token and no stored user, forbid data-fetching endpoints on the client
  const dataEndpoints = ['/accounts', '/transactions', '/payments', '/investments', '/categories', '/credit-cards']
  if (!token && !userId && dataEndpoints.some(e => path.startsWith(e))) {
    // Return a synthetic 401 Response so callers treat it as unauthorized
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  // If backend returned unauthorized, dispatch global event so UI can react
  if (res.status === 401) {
    try {
      // clear client-side stored user/token
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('easier_token')
        localStorage.removeItem('easier_user')
      }
      // dispatch event for listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('unauthorized'))
      }
    } catch (e) {
      // ignore
    }
  }

  return res
}

export const api = {
  // Users
  async getCurrentUser() {
    const response = await request('/users/me')
    if (response.status === 400 || response.status === 401) return null
    if (!response.ok) throw new Error('Failed to fetch user')
    return response.json()
  },

  // Accounts
  async getAccounts() {
    const response = await request('/accounts')
    if (!response.ok) throw new Error('Failed to fetch accounts')
    return response.json()
  },

  async createAccount(data: any) {
    const response = await request('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create account')
    return response.json()
  },

  async updateAccount(id: string, data: any) {
    const response = await request(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update account')
    return response.json()
  },

  async deleteAccount(id: string) {
    const response = await request(`/accounts/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete account')
  },

  // Credit cards and invoices
  async getCreditCards() {
    const response = await request('/credit-cards')
    if (!response.ok) throw new Error('Failed to fetch credit cards')
    return response.json()
  },

  async createCreditCard(data: { accountId: string; name: string }) {
    const response = await request('/credit-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error || 'Failed to create credit card')
    }
    return response.json()
  },

  async updateCreditCard(id: string, data: { name: string }) {
    const response = await request(`/credit-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error || 'Failed to update credit card')
    }
    return response.json()
  },

  async createCreditCardInvoice(cardId: string, data: {
    amount: number
    dueDate: string
    paidDate: string | null
    status: 'pending' | 'paid'
  }) {
    const response = await request(`/credit-cards/${cardId}/invoices`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error || 'Failed to create credit card invoice')
    }
    return response.json()
  },

  async updateCreditCardInvoice(cardId: string, invoiceId: string, data: {
    amount: number
    dueDate: string
    paidDate: string | null
    status: 'pending' | 'paid'
  }) {
    const response = await request(`/credit-cards/${cardId}/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error || 'Failed to update credit card invoice')
    }
    return response.json()
  },

  async deleteCreditCardInvoice(cardId: string, invoiceId: string) {
    const response = await request(`/credit-cards/${cardId}/invoices/${invoiceId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error || 'Failed to delete credit card invoice')
    }
  },

  // Transactions
  async getTransactions(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    const response = await request(`/transactions${query}`)
    if (!response.ok) throw new Error('Failed to fetch transactions')
    return response.json()
  },

  async createTransaction(data: any) {
    const response = await request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create transaction')
    return response.json()
  },

  async updateTransaction(id: string, data: any) {
    const response = await request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update transaction')
    return response.json()
  },

  async deleteTransaction(id: string) {
    const response = await request(`/transactions/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete transaction')
  },

  // Categories
  async getCategories(type?: 'income' | 'expense') {
    const query = type ? `?type=${type}` : ''
    const response = await request(`/categories${query}`)
    if (!response.ok) throw new Error('Failed to fetch categories')
    return response.json()
  },
  async createCategory(data: any) {
    const response = await request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      let body: any = null
      try { body = await response.json() } catch (e) { /* ignore */ }
      const msg = body && (body.error || body.message) ? (body.error || body.message) : 'Failed to create category'
      throw new Error(msg)
    }
    return response.json()
  },

  // Payments
  async getPayments(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    const response = await request(`/payments${query}`)
    if (!response.ok) throw new Error('Failed to fetch payments')
    return response.json()
  },

  async createPayment(data: any) {
    const response = await request('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      let body: any = null
      try { body = await response.json() } catch (e) { /* ignore */ }
      const msg = body && (body.error || body.message) ? (body.error || body.message) : 'Failed to create payment'
      throw new Error(msg)
    }
    return response.json()
  },

  async updatePayment(id: string, data: any) {
    const response = await request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update payment')
    return response.json()
  },

  async createPaymentOccurrence(paymentId: string, data: any) {
    const response = await request(`/payments/${paymentId}/occurrences`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      let body: any = null
      try { body = await response.json() } catch (e) { /* ignore */ }
      const msg = body && (body.error || body.message) ? (body.error || body.message) : 'Failed to create occurrence'
      throw new Error(msg)
    }
    return response.json()
  },
  async deletePaymentOccurrence(paymentId: string, occurrenceId: string) {
    const response = await request(`/payments/${paymentId}/occurrences/${occurrenceId}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete occurrence')
  },

  async getPayment(id: string) {
    const response = await request(`/payments/${id}`)
    if (!response.ok) throw new Error('Failed to fetch payment')
    return response.json()
  },

  async deletePayment(id: string) {
    const response = await request(`/payments/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete payment')
  },

  // Investments
  async getInvestments() {
    const response = await request('/investments')
    if (!response.ok) throw new Error('Failed to fetch investments')
    return response.json()
  },

  async createInvestment(data: any) {
    const response = await request('/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create investment')
    return response.json()
  },

  async updateInvestment(id: string, data: any) {
    const response = await request(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update investment')
    return response.json()
  },

  async deleteInvestment(id: string) {
    const response = await request(`/investments/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete investment')
  },

  // Debts
  async getDebts() {
    const response = await request('/debts')
    if (!response.ok) throw new Error('Failed to fetch debts')
    return response.json()
  },

  async createDebt(data: any) {
    const response = await request('/debts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create debt')
    return response.json()
  },

  async updateDebt(id: string, data: any) {
    const response = await request(`/debts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update debt')
    return response.json()
  },

  async deleteDebt(id: string) {
    const response = await request(`/debts/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete debt')
  },

  async settleDebt(id: string, settledAt: string, paymentIds?: string[]) {
    const response = await request(`/debts/${id}/settle`, {
      method: 'POST',
      body: JSON.stringify({ settledAt, paymentIds }),
    })
    if (!response.ok) throw new Error('Failed to settle debt')
    return response.json()
  },
}
