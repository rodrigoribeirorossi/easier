import { Router, Request, Response } from 'express'
import { Prisma, PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

function getUserId(req: Request) {
  return req.headers['x-user-id'] as string | undefined
}

function getRouteParam(req: Request, key: string) {
  const value = req.params[key]
  return Array.isArray(value) ? value[0] : value
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function parseInvoiceInput(body: any) {
  const amount = Number(body.amount)
  const dueDate = parseDate(body.dueDate)
  const paidDate = body.paidDate ? parseDate(body.paidDate) : null
  const status = body.status === undefined ? 'pending' : body.status

  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Informe um valor de fatura maior que zero.' }
  if (!dueDate) return { error: 'Informe uma data de vencimento válida.' }
  if (status !== 'pending' && status !== 'paid') return { error: 'Status de fatura inválido.' }
  if (body.paidDate && !paidDate) return { error: 'Informe uma data de pagamento válida.' }
  if (status === 'paid' && !paidDate) return { error: 'Informe a data de pagamento da fatura paga.' }
  if (status === 'pending' && paidDate) return { error: 'Faturas pendentes não podem ter data de pagamento.' }

  return { data: { amount, dueDate, paidDate, status } }
}

function getDueMonth(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

async function hasInvoiceInDueMonth(cardId: string, dueDate: Date, excludedInvoiceId?: string) {
  const startOfMonth = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), 1))
  const startOfNextMonth = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth() + 1, 1))
  const invoice = await prisma.creditCardInvoice.findFirst({
    where: {
      creditCardId: cardId,
      ...(excludedInvoiceId ? { id: { not: excludedInvoiceId } } : {}),
      dueDate: { gte: startOfMonth, lt: startOfNextMonth },
    },
    select: { id: true },
  })
  return Boolean(invoice)
}

router.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Usuário não autenticado.' })

  try {
    const cards = await prisma.creditCard.findMany({
      where: { userId },
      include: {
        account: { select: { id: true, name: true, type: true, color: true } },
        invoices: { orderBy: { dueDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(cards)
  } catch (error) {
    console.error('Error fetching credit cards:', error)
    res.status(500).json({ error: 'Falha ao carregar cartões de crédito.' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const accountId = typeof req.body.accountId === 'string' ? req.body.accountId : ''
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  if (!userId) return res.status(401).json({ error: 'Usuário não autenticado.' })
  if (!accountId || !name) return res.status(400).json({ error: 'Informe a conta e o nome do cartão.' })

  try {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
    if (!account) return res.status(404).json({ error: 'Conta não encontrada para este usuário.' })

    const card = await prisma.creditCard.create({
      data: { accountId, userId, name },
      include: { account: { select: { id: true, name: true, type: true, color: true } }, invoices: true },
    })
    res.status(201).json(card)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ error: 'Esta conta já possui um cartão associado.' })
    }
    console.error('Error creating credit card:', error)
    res.status(500).json({ error: 'Falha ao criar cartão de crédito.' })
  }
})

router.put('/:cardId', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const cardId = getRouteParam(req, 'cardId')
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  if (!userId) return res.status(401).json({ error: 'Usuário não autenticado.' })
  if (!cardId) return res.status(400).json({ error: 'Identificador do cartão inválido.' })
  if (!name) return res.status(400).json({ error: 'Informe o nome do cartão.' })

  try {
    const existing = await prisma.creditCard.findFirst({
      where: { id: cardId, userId },
      select: { id: true },
    })
    if (!existing) return res.status(404).json({ error: 'Cartão não encontrado.' })

    const card = await prisma.creditCard.update({
      where: { id: existing.id },
      data: { name },
      include: { account: { select: { id: true, name: true, type: true, color: true } }, invoices: true },
    })
    res.json(card)
  } catch (error) {
    console.error('Error updating credit card:', error)
    res.status(500).json({ error: 'Falha ao atualizar cartão de crédito.' })
  }
})

router.post('/:cardId/invoices', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const cardId = getRouteParam(req, 'cardId')
  if (!userId) return res.status(401).json({ error: 'Usuário não autenticado.' })
  if (!cardId) return res.status(400).json({ error: 'Identificador do cartão inválido.' })
  const parsed = parseInvoiceInput(req.body)
  if ('error' in parsed) return res.status(400).json({ error: parsed.error })

  try {
    const card = await prisma.creditCard.findFirst({
      where: { id: cardId, userId },
      select: { id: true },
    })
    if (!card) return res.status(404).json({ error: 'Cartão não encontrado.' })
    if (await hasInvoiceInDueMonth(card.id, parsed.data.dueDate)) {
      return res.status(409).json({ error: 'Já existe uma fatura cadastrada para este cartão no mês de vencimento informado.' })
    }

    const invoice = await prisma.creditCardInvoice.create({
      data: { ...parsed.data, creditCardId: card.id },
    })
    res.status(201).json(invoice)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ error: 'Já existe uma fatura cadastrada para este cartão e mês.' })
    }
    console.error('Error creating credit card invoice:', error)
    res.status(500).json({ error: 'Falha ao cadastrar fatura.' })
  }
})

router.put('/:cardId/invoices/:invoiceId', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const cardId = getRouteParam(req, 'cardId')
  const invoiceId = getRouteParam(req, 'invoiceId')
  if (!userId) return res.status(401).json({ error: 'Usuário não autenticado.' })
  if (!cardId || !invoiceId) return res.status(400).json({ error: 'Identificador da fatura inválido.' })
  const parsed = parseInvoiceInput(req.body)
  if ('error' in parsed) return res.status(400).json({ error: parsed.error })

  try {
    const existing = await prisma.creditCardInvoice.findFirst({
      where: {
        id: invoiceId,
        creditCardId: cardId,
        creditCard: { userId },
      },
      select: { id: true },
    })
    if (!existing) return res.status(404).json({ error: 'Fatura não encontrada.' })
    const currentInvoice = await prisma.creditCardInvoice.findUnique({
      where: { id: existing.id },
      select: { dueDate: true },
    })
    if (
      currentInvoice &&
      getDueMonth(currentInvoice.dueDate) !== getDueMonth(parsed.data.dueDate) &&
      await hasInvoiceInDueMonth(cardId, parsed.data.dueDate, existing.id)
    ) {
      return res.status(409).json({ error: 'Já existe uma fatura cadastrada para este cartão no mês de vencimento informado.' })
    }

    const invoice = await prisma.creditCardInvoice.update({
      where: { id: existing.id },
      data: parsed.data,
    })
    res.json(invoice)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ error: 'Já existe uma fatura cadastrada para este cartão e mês.' })
    }
    console.error('Error updating credit card invoice:', error)
    res.status(500).json({ error: 'Falha ao atualizar fatura.' })
  }
})

router.delete('/:cardId/invoices/:invoiceId', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const cardId = getRouteParam(req, 'cardId')
  const invoiceId = getRouteParam(req, 'invoiceId')
  if (!userId) return res.status(401).json({ error: 'Usuário não autenticado.' })
  if (!cardId || !invoiceId) return res.status(400).json({ error: 'Identificador da fatura inválido.' })

  try {
    const existing = await prisma.creditCardInvoice.findFirst({
      where: {
        id: invoiceId,
        creditCardId: cardId,
        creditCard: { userId },
      },
      select: { id: true },
    })
    if (!existing) return res.status(404).json({ error: 'Fatura não encontrada.' })

    await prisma.creditCardInvoice.delete({ where: { id: existing.id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting credit card invoice:', error)
    res.status(500).json({ error: 'Falha ao excluir fatura.' })
  }
})

export default router
