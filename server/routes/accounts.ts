import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    // DEBUG: log headers and query to diagnose unexpected authentication
    console.log('[DEBUG] /api/accounts headers:', JSON.stringify(req.headers));
    console.log('[DEBUG] /api/accounts query:', JSON.stringify(req.query));

    const { type } = req.query;
    const userIdFromQuery = req.query.userId as string | undefined
    const userIdFromHeader = (req.headers['x-user-id'] as string) || undefined
    const uid = userIdFromQuery || userIdFromHeader

    // If no userId provided (neither query nor header), return empty list
    if (!uid) return res.json([])

    const where: any = {};
    where.userId = uid;
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
    const userIdFromHeader = (req.headers['x-user-id'] as string) || undefined
    const uid = userId || userIdFromHeader

    if (!name || !type || !uid) {
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
        userId: String(uid),
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

    // Ensure the authenticated user owns this account
    const userIdFromHeader = (req.headers['x-user-id'] as string) || undefined
    if (existingAccount && userIdFromHeader && existingAccount.userId !== userIdFromHeader) {
      return res.status(403).json({ error: 'Forbidden' })
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

    // ensure authenticated user owns this account
    const userIdFromHeader = (req.headers['x-user-id'] as string) || undefined
    if (account && userIdFromHeader && account.userId !== userIdFromHeader) {
      return res.status(403).json({ error: 'Forbidden' })
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
