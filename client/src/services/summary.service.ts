import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { MonthlySummary } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

export const getSummary = async (
  month: number,
  year: number,
): Promise<MonthlySummary> => {
  const res = await axios.get(apiUrl(ENDPOINTS.summary.base), {
    params: { month, year },
  });
  return res.data.data as MonthlySummary;
};
