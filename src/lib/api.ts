const API_BASE_URL = 'http://localhost:3001/api'

export const api = {
  // Users
  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/users/me`)
    if (!response.ok) throw new Error('Failed to fetch user')
    return response.json()
  },

  // Accounts
  async getAccounts() {
    const response = await fetch(`${API_BASE_URL}/accounts`)
    if (!response.ok) throw new Error('Failed to fetch accounts')
    return response.json()
  },

  async createAccount(data: any) {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create account')
    return response.json()
  },

  async updateAccount(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update account')
    return response.json()
  },

  async deleteAccount(id: string) {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete account')
  },

  // Transactions
  async getTransactions(params?: any) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/transactions${query ? `?${query}` : ''}`)
    if (!response.ok) throw new Error('Failed to fetch transactions')
    return response.json()
  },

  async createTransaction(data: any) {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create transaction')
    return response.json()
  },

  async updateTransaction(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update transaction')
    return response.json()
  },

  async deleteTransaction(id: string) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete transaction')
  },

  // Categories
  async getCategories(type?: 'income' | 'expense') {
    const query = type ? `?type=${type}` : ''
    const response = await fetch(`${API_BASE_URL}/categories${query}`)
    if (!response.ok) throw new Error('Failed to fetch categories')
    return response.json()
  },

  // Payments
  async getPayments(params?: any) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/payments${query ? `?${query}` : ''}`)
    if (!response.ok) throw new Error('Failed to fetch payments')
    return response.json()
  },

  async createPayment(data: any) {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create payment')
    return response.json()
  },

  async updatePayment(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update payment')
    return response.json()
  },

  async deletePayment(id: string) {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete payment')
  },

  // Investments
  async getInvestments() {
    const response = await fetch(`${API_BASE_URL}/investments`)
    if (!response.ok) throw new Error('Failed to fetch investments')
    return response.json()
  },

  async createInvestment(data: any) {
    const response = await fetch(`${API_BASE_URL}/investments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create investment')
    return response.json()
  },

  async updateInvestment(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/investments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update investment')
    return response.json()
  },

  async deleteInvestment(id: string) {
    const response = await fetch(`${API_BASE_URL}/investments/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete investment')
  },
}
