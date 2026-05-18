import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { API_PREFIX, ENDPOINTS } from '@gutplus/shared';
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
app.use(`${API_PREFIX}/${ENDPOINTS.users.base}`, userRoutes);
app.use(`${API_PREFIX}/${ENDPOINTS.tokens.base}`, tokenRoutes);
app.use(`${API_PREFIX}/${ENDPOINTS.households.base}`, authGuard, householdRoutes);
app.use(`${API_PREFIX}/${ENDPOINTS.accounts.base}`, authGuard, accountRoutes);
app.use(`${API_PREFIX}/${ENDPOINTS.categories.base}`, authGuard, categoryRoutes);
app.use(`${API_PREFIX}/${ENDPOINTS.familyMembers.base}`, authGuard, familyMemberRoutes);
app.use(`${API_PREFIX}/${ENDPOINTS.budgetPlans.base}`, authGuard, budgetPlanRoutes);
app.use(`${API_PREFIX}/${ENDPOINTS.transactions.base}`, authGuard, transactionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

export default app;