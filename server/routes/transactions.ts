import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { accountId, categoryId, type, startDate, endDate, sortBy = 'date', order = 'desc' } = req.query;

    const userIdFromQuery = req.query.userId as string | undefined
    const userIdFromHeader = (req.headers['x-user-id'] as string) || undefined
    const uid = userIdFromQuery || userIdFromHeader

    // If no userId provided, return empty list to avoid returning everyone else's transactions
    if (!uid) return res.json([])

    const where: any = {};

    where.userId = uid;
    if (accountId) where.accountId = accountId as string;
    if (categoryId) where.categoryId = categoryId as string;
    if (type) where.type = type as string;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = order as string;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy,
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, amount, description, date, isRecurring, recurrenceEndDate, frequency, tags, accountId, categoryId, userId } = req.body;

    const userIdFromHeader = (req.headers['x-user-id'] as string) || undefined
    const uid = userId || userIdFromHeader

    if (!type || !amount || !description || !date || !accountId || !categoryId || !uid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          type: String(type),
          amount: parseFloat(String(amount)),
          description: String(description),
          date: new Date(date),
          recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
          frequency: frequency ? String(frequency) : null,
          isRecurring: isRecurring || false,
          tags: tags ? JSON.stringify(tags) : null,
          accountId: String(accountId),
          categoryId: String(categoryId),
          userId: String(uid),
        },
        include: {
          account: true,
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      const account = await tx.account.findUnique({ where: { id: String(accountId) } });
      if (account) {
        const balanceChange = String(type) === 'income' ? parseFloat(String(amount)) : -parseFloat(String(amount));
        await tx.account.update({
          where: { id: String(accountId) },
          data: { balance: account.balance + balanceChange },
        });
      }

      return newTransaction;
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { type, amount, description, date, isRecurring, recurrenceEndDate, frequency, tags, accountId, categoryId } = req.body;

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // ensure authenticated user owns this transaction
    const userIdFromHeader = (req.headers['x-user-id'] as string) || undefined
    if (existingTransaction && userIdFromHeader && existingTransaction.userId !== userIdFromHeader) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const transaction = await prisma.$transaction(async (tx) => {
      if (existingTransaction.accountId === accountId || !accountId) {
        const oldBalanceChange = existingTransaction.type === 'income' 
          ? -existingTransaction.amount 
          : existingTransaction.amount;
        
        await tx.account.update({
          where: { id: existingTransaction.accountId },
          data: { balance: existingTransaction.account.balance + oldBalanceChange },
        });
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          ...(type && { type: String(type) }),
          ...(amount !== undefined && { amount: parseFloat(String(amount)) }),
          ...(description && { description: String(description) }),
          ...(date && { date: new Date(date) }),
          ...(recurrenceEndDate !== undefined && { recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null }),
          ...(frequency !== undefined && { frequency: frequency ? String(frequency) : null }),
          ...(isRecurring !== undefined && { isRecurring }),
          ...(tags && { tags: JSON.stringify(tags) }),
          ...(accountId && { accountId: String(accountId) }),
          ...(categoryId && { categoryId: String(categoryId) }),
        },
        include: {
          account: true,
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      const newType = type ? String(type) : existingTransaction.type;
      const newAmount = amount !== undefined ? parseFloat(String(amount)) : existingTransaction.amount;
      const newBalanceChange = newType === 'income' ? newAmount : -newAmount;

      await tx.account.update({
        where: { id: updatedTransaction.accountId },
        data: { 
          balance: {
            increment: newBalanceChange,
          },
        },
      });

      return updatedTransaction;
    });

    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // ensure authenticated user owns this transaction
    const userIdFromHeader = (req.headers['x-user-id'] as string) || undefined
    if (transaction && userIdFromHeader && transaction.userId !== userIdFromHeader) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.$transaction(async (tx) => {
      const balanceChange = transaction.type === 'income' 
        ? -transaction.amount 
        : transaction.amount;

      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: transaction.account.balance + balanceChange },
      });

      await tx.transaction.delete({
        where: { id },
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
