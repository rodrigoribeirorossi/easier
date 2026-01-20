import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, status, categoryId, startDate, endDate, sortBy = 'dueDate', order = 'asc' } = req.query;

    const where: any = {};

    if (userId) where.userId = userId as string;
    if (status) where.status = status as string;
    if (categoryId) where.categoryId = categoryId as string;

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate as string);
      if (endDate) where.dueDate.lte = new Date(endDate as string);
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = order as string;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        category: true,
        account: true,
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

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        category: true,
        account: true,
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

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, amount, dueDate, isRecurring, frequency, status, categoryId, accountId, userId } = req.body;

    if (!name || !amount || !dueDate || !categoryId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const payment = await prisma.payment.create({
      data: {
        name: String(name),
        amount: parseFloat(String(amount)),
        dueDate: new Date(dueDate),
        isRecurring: isRecurring || false,
        frequency: frequency ? String(frequency) : null,
        status: status ? String(status) : 'pending',
        categoryId: String(categoryId),
        accountId: accountId ? String(accountId) : null,
        userId: String(userId),
      },
      include: {
        category: true,
        account: true,
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

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, amount, dueDate, isRecurring, frequency, status, categoryId, accountId } = req.body;

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(name && { name: String(name) }),
        ...(amount !== undefined && { amount: parseFloat(String(amount)) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(frequency !== undefined && { frequency: frequency ? String(frequency) : null }),
        ...(status && { status: String(status) }),
        ...(categoryId && { categoryId: String(categoryId) }),
        ...(accountId !== undefined && { accountId: accountId ? String(accountId) : null }),
      },
      include: {
        category: true,
        account: true,
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

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await prisma.payment.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

export default router;
