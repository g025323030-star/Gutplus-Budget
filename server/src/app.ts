import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
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
import { AppDataSource } from './config/data-source';

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173'];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// const PORT: number = process.env.PORT ? Number(process.env.PORT) : 8080;

// app.get('/', (req, res) => {
//     res.send('השרת באוויר ועובד בהצלחה!');
// });

// app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server is running on port ${PORT}`);
// });

app.use(cookieParser());
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
app.get('/health', async (req, res) => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.query('SELECT 1');
    }
    res.status(200).json({ status: 'OK', db: 'up', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', db: 'down', timestamp: new Date().toISOString() });
  }
});

// Error handling middleware
app.use(errorHandler);

export default app;