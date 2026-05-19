import { useState, useEffect, useCallback, useRef } from 'react';

const IDLE_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'] as const;

export const useIdleTimer = (idleMs: number) => {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // When true, activity events are ignored — prevents accidental dismissal via mouse move
  const isPausedRef = useRef(false);

  const startTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isPausedRef.current = true; // Pause activity tracking once idle fires
      setIsIdle(true);
    }, idleMs);
  }, [idleMs]);

  const handleActivity = useCallback(() => {
    if (isPausedRef.current) return; // Modal is showing — ignore all activity
    setIsIdle(false);
    startTimer();
  }, [startTimer]);

  // Called explicitly by the "Renew" button — the only way to resume after idle
  const resume = useCallback(() => {
    isPausedRef.current = false;
    setIsIdle(false);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    IDLE_EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    startTimer();
    return () => {
      IDLE_EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
      clearTimeout(timerRef.current);
    };
  }, [handleActivity, startTimer]);

  return { isIdle, resume };
};
