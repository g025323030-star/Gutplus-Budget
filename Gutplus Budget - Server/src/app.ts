import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  householdRoutes,
  userRoutes,
  tokenRoutes,
  accountRoutes,
  categoryRoutes,
  familyMemberRoutes,
  budgetPlanRoutes,
  transactionRoutes,
} from './routes';
import { errorHandler } from './middlewares';
import { rollingTokenMiddleware } from './middlewares/referenceToken';
import { authGuard } from './middlewares/authGuard';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(rollingTokenMiddleware); // הוספת המידלוור לטיפול בטוקן מתגלגל לפני כל שאר המידלוורים

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/households', authGuard, householdRoutes);
app.use('/api/accounts', authGuard, accountRoutes);
app.use('/api/categories', authGuard, categoryRoutes);
app.use('/api/family-members', authGuard, familyMemberRoutes);
app.use('/api/budget-plans', authGuard, budgetPlanRoutes);
app.use('/api/transactions', authGuard, transactionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

export default app;