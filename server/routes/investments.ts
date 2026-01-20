import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, type, sortBy = 'startDate', order = 'desc' } = req.query;

    const where: any = {};

    if (userId) where.userId = userId as string;
    if (type) where.type = type as string;

    const orderBy: any = {};
    orderBy[sortBy as string] = order as string;

    const investments = await prisma.investment.findMany({
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
      },
      orderBy,
    });

    res.json(investments);
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const investment = await prisma.investment.findUnique({
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
      },
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    res.json(investment);
  } catch (error) {
    console.error('Error fetching investment:', error);
    res.status(500).json({ error: 'Failed to fetch investment' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, initialAmount, currentAmount, annualRate, startDate, maturityDate, userId } = req.body;

    if (!name || !type || !initialAmount || !currentAmount || !annualRate || !startDate || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const investment = await prisma.investment.create({
      data: {
        name: String(name),
        type: String(type),
        initialAmount: parseFloat(String(initialAmount)),
        currentAmount: parseFloat(String(currentAmount)),
        annualRate: parseFloat(String(annualRate)),
        startDate: new Date(startDate),
        maturityDate: maturityDate ? new Date(maturityDate) : null,
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

    res.status(201).json(investment);
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, initialAmount, currentAmount, annualRate, startDate, maturityDate } = req.body;

    const existingInvestment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!existingInvestment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    const investment = await prisma.investment.update({
      where: { id },
      data: {
        ...(name && { name: String(name) }),
        ...(type && { type: String(type) }),
        ...(initialAmount !== undefined && { initialAmount: parseFloat(String(initialAmount)) }),
        ...(currentAmount !== undefined && { currentAmount: parseFloat(String(currentAmount)) }),
        ...(annualRate !== undefined && { annualRate: parseFloat(String(annualRate)) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(maturityDate !== undefined && { maturityDate: maturityDate ? new Date(maturityDate) : null }),
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

    res.json(investment);
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({ error: 'Failed to update investment' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const investment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    await prisma.investment.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

export default router;
