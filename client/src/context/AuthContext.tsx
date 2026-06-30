import { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  householdId: string | null;
  onboardingCompleted: boolean;
  expenseTemplatesInitialized: boolean;
  incomeTemplatesInitialized: boolean;
  checkAuth: () => Promise<boolean>;
  refreshUserStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [expenseTemplatesInitialized, setExpenseTemplatesInitialized] =
    useState(false);
  const [incomeTemplatesInitialized, setIncomeTemplatesInitialized] =
    useState(false);

  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await axios.get(apiUrl(ENDPOINTS.users.me));
      const payload = res.data?.data ?? res.data ?? {};
      setUserId(payload.id ?? null);
      setHouseholdId(payload.householdId ?? null);
      setOnboardingCompleted(Boolean(payload.onboardingCompleted));
      setExpenseTemplatesInitialized(
        Boolean(payload.expenseTemplatesInitialized),
      );
      setIncomeTemplatesInitialized(
        Boolean(payload.incomeTemplatesInitialized),
      );
      setIsAuthenticated(true);
      return true;
    } catch {
      setUserId(null);
      setHouseholdId(null);
      setOnboardingCompleted(false);
      setExpenseTemplatesInitialized(false);
      setIncomeTemplatesInitialized(false);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserStatus = async (): Promise<void> => {
    await checkAuth();
  };

  const logout = async (): Promise<void> => {
    try {
      await axios.post(apiUrl(ENDPOINTS.users.logout));
    } finally {
      setUserId(null);
      setHouseholdId(null);
      setOnboardingCompleted(false);
      setExpenseTemplatesInitialized(false);
      setIncomeTemplatesInitialized(false);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userId,
        householdId,
        onboardingCompleted,
        expenseTemplatesInitialized,
        incomeTemplatesInitialized,
        checkAuth,
        refreshUserStatus,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
