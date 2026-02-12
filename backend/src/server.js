import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import itemsRouter from './routes/items.js';
import suppliersRouter from './routes/suppliers.js';
import stockInRouter from './routes/stockIn.js';
import stockOutRouter from './routes/stockOut.js';
import balanceRouter from './routes/balance.js';
import dashboardRouter from './routes/dashboard.js';
import notificationsRouter from './routes/notifications.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Static files for proof of delivery PDFs
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/users', authenticateToken, usersRouter);
app.use('/api/items', authenticateToken, itemsRouter);
app.use('/api/suppliers', authenticateToken, suppliersRouter);
app.use('/api/stock-in', authenticateToken, stockInRouter);
app.use('/api/stock-out', authenticateToken, stockOutRouter);
app.use('/api/balance', authenticateToken, balanceRouter);
app.use('/api/dashboard', authenticateToken, dashboardRouter);
app.use('/api/notifications', authenticateToken, notificationsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
