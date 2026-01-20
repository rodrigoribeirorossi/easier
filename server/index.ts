import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import transactionsRouter from './routes/transactions.js';
import accountsRouter from './routes/accounts.js';
import paymentsRouter from './routes/payments.js';
import investmentsRouter from './routes/investments.js';
import categoriesRouter from './routes/categories.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/users', usersRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
