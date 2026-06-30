import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { MonthlyForecast } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

// Fetches the rolling 12-month forecast (goal-first amounts, holidays placed).
export const getBudgetForecast = async (): Promise<MonthlyForecast[]> => {
  const res = await axios.get(apiUrl(ENDPOINTS.budgetForecast.base));
  return (res.data.data?.months as MonthlyForecast[]) ?? [];
};
