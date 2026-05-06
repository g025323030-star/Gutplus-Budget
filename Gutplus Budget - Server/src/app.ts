import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  householdRoutes,
  userRoutes,
  accountRoutes,
  categoryRoutes,
  familyMemberRoutes,
  budgetPlanRoutes,
  transactionRoutes,
} from './routes';
import { errorHandler } from './middlewares';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/households', householdRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/budget-plans', budgetPlanRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

export default app;