import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';
import type { Household } from '@gutplus/shared';

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

export interface CreateHouseholdPayload {
  name: string;
}

export const createHousehold = async (
  payload: CreateHouseholdPayload,
): Promise<Household> => {
  const res = await axios.post(apiUrl(ENDPOINTS.households.base), payload);
  return res.data?.data ?? res.data;
};

export const getHousehold = async (id: string): Promise<Household> => {
  const res = await axios.get(apiUrl(`${ENDPOINTS.households.base}/${id}`));
  return res.data?.data ?? res.data;
};
