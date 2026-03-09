import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/database';

import authRoutes from './routes/auth';
import expenseRoutes from './routes/expenses';
import shiftRoutes from './routes/shifts';
import creditCardRoutes, { creditChargesRouter } from './routes/creditCards';
import assetRoutes from './routes/assets';
import taskRoutes from './routes/tasks';
import budgetRoutes from './routes/budgets';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/credit-charges', creditChargesRouter);
app.use('/api/assets', assetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const start = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
