import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import transactionsRouter from './routes/transactions.js';
import accountsRouter from './routes/accounts.js';
import paymentsRouter from './routes/payments.js';
import investmentsRouter from './routes/investments.js';
import categoriesRouter from './routes/categories.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import attachUser from './middleware/attachUser.js';
import authMiddleware from './middleware/authMiddleware.js';
import debugRouter from './routes/debug.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
app.use(cors());
app.use(express.json());

// Global request logger (logs immediately when app starts receiving requests)
app.use((req, res, next) => {
    const start = Date.now()
    try {
        console.log('[REQ] %s %s from %s', req.method, req.originalUrl, req.ip || req.socket.remoteAddress)
        // Log a subset of headers for privacy
        const hdrs: any = {
            host: req.headers.host,
            referer: req.headers.referer,
            origin: req.headers.origin,
            cookie: req.headers.cookie ? '[present]' : '[none]',
            authorization: req.headers.authorization ? '[present]' : '[none]'
        }
        console.log('[REQ-HEADERS]', JSON.stringify(hdrs))
    } catch (e) {
        // ignore logging errors
    }

    res.on('finish', () => {
        const ms = Date.now() - start
        console.log('[RES] %s %s -> %s (%dms)', req.method, req.originalUrl, res.statusCode, ms)
    })

    next()
})

// Attach user id from header to request query/body when provided
app.use(attachUser);

// Enforce token-based auth for most API routes (force login flow). Exceptions: /api/auth, /api/debug, /api/users, /api/health
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const path = req.path || ''
    if (path.startsWith('/auth') || path.startsWith('/debug') || path.startsWith('/users') || path === '/health') {
        res.setHeader('Cache-Control', 'no-store')
        return next()
    }

    // Require Authorization header
    if (!req.headers.authorization) {
        // Also check for token in query/body as fallback
        const maybeToken = (req.query.token as string) || (req.body && req.body.token)
        if (!maybeToken) {
            return res.status(401).json({ error: 'Unauthorized - Authorization: Bearer <token> required' })
        }
    }

    res.setHeader('Cache-Control', 'no-store')
    next()
})

// Public debug endpoint (inspect headers/cookies)
app.use('/api/debug', debugRouter)
// API routes
// Protected API routes (require Authorization: Bearer <token>)
app.use('/api/transactions', authMiddleware, transactionsRouter);
app.use('/api/accounts', authMiddleware, accountsRouter);
app.use('/api/payments', authMiddleware, paymentsRouter);
app.use('/api/investments', authMiddleware, investmentsRouter);
app.use('/api/categories', authMiddleware, categoriesRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve static files in production
if (isProduction) {
    const distPath = path.join(__dirname, '..');
    app.use(express.static(distPath));
    // SPA fallback (catch-all não-API!)
    app.use((req, res) => {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(404).json({ error: 'Not Found' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
}
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});
if (!isProduction) {
    app.use((_req, res) => {
        res.status(404).json({ error: 'Not Found' });
    });
}
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}  PID:${process.pid}`);
    if (isProduction) {
        console.log(`📦 Serving static files from dist/`);
    }
});
