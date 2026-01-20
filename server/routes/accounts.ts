import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (type) where.type = type as string;

    const accounts = await prisma.account.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        transactions: {
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            transactions: true,
            payments: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, balance, currency, color, icon, userId } = req.body;

    if (!name || !type || !userId) {
      return res.status(400).json({ error: 'Missing required fields: name, type, userId' });
    }

    const account = await prisma.account.create({
      data: {
        name: String(name),
        type: String(type),
        balance: balance ? parseFloat(String(balance)) : 0,
        currency: currency ? String(currency) : 'BRL',
        color: color ? String(color) : '#3b82f6',
        icon: icon ? String(icon) : 'wallet',
        userId: String(userId),
      },
      include: {
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

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, type, balance, currency, color, icon } = req.body;

    const existingAccount = await prisma.account.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        ...(name && { name: String(name) }),
        ...(type && { type: String(type) }),
        ...(balance !== undefined && { balance: parseFloat(String(balance)) }),
        ...(currency && { currency: String(currency) }),
        ...(color && { color: String(color) }),
        ...(icon && { icon: String(icon) }),
      },
      include: {
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

    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            payments: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await prisma.account.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
