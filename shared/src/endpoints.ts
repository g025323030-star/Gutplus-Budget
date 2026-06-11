/**
 * URL constants for the HTTP API.
 *
 * `API_PREFIX` is mounted by the server (e.g. `/api`).
 * `*.base` values are the resource segments mounted under the prefix
 * (e.g. server: `app.use('/api/users', userRoutes)`).
 * Other entries are paths relative to the server's `VITE_SERVER_URL`
 * environment variable, which on the client already ends with `/api/`.
 */
export const API_PREFIX = '/api';

export const ENDPOINTS = {
  users: {
    base: 'users',
    checkEmail: 'users/check-email',
    signUp: 'users/sign-up',
    login: 'users/login',
    forgotPassword: 'users/forgot-password',
    me: 'users/me',
    logout: 'users/logout',
    completeOnboarding: 'users/complete-onboarding',
  },
  tokens: {
    base: 'tokens',
    resetPassword: 'tokens/reset-password',
  },
  households: {
    base: 'households',
  },
  accounts: {
    base: 'accounts',
  },
  categories: {
    base: 'categories',
  },
  familyMembers: {
    base: 'family-members',
  },
  budgetPlans: {
    base: 'budget-plans',
  },
  budgetItems: {
    base: 'budget-items',
  },
} as const;
