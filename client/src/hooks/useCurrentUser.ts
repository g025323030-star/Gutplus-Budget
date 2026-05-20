import { useEffect, useState } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@gutplus/shared';

interface CurrentUserState {
  userId: string | null;
  householdId: string | null;
  isLoading: boolean;
  error: string | null;
}

const apiUrl = (path: string): string =>
  import.meta.env.VITE_SERVER_URL + path;

let cache: { userId: string; householdId: string } | null = null;

export function useCurrentUser(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>(() =>
    cache
      ? {
          userId: cache.userId,
          householdId: cache.householdId,
          isLoading: false,
          error: null,
        }
      : {
          userId: null,
          householdId: null,
          isLoading: true,
          error: null,
        },
  );

  useEffect(() => {
    if (cache) return;

    let cancelled = false;

    const load = async () => {
      try {
        const res = await axios.get(apiUrl(ENDPOINTS.users.me));
        const payload = res.data?.data ?? res.data ?? {};
        const userId: string | undefined = payload.id;
        const householdId: string | null = payload.householdId ?? null;

        if (cancelled) return;

        if (!userId) {
          setState({
            userId: null,
            householdId: null,
            isLoading: false,
            error: 'לא ניתן לזהות את המשתמש',
          });
          return;
        }

        if (householdId) {
          cache = { userId, householdId };
        }

        setState({
          userId,
          householdId,
          isLoading: false,
          error: householdId ? null : 'לא נמצא משק בית עבור המשתמש',
        });
      } catch (err) {
        if (cancelled) return;
        console.error('useCurrentUser error:', err);
        setState({
          userId: null,
          householdId: null,
          isLoading: false,
          error: 'שגיאה בטעינת פרטי המשתמש',
        });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
