import { useEffect, useRef } from 'react';
import { authService } from '../services/authService';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
const ACTIVITY_DEBOUNCE_MS = 1000;

export default function useIdleLogout({ enabled = true, idleMs, refreshMs, onIdle }) {
  const lastActivityRef = useRef(Date.now());
  const lastDebouncedTouchRef = useRef(0);
  const idleTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const scheduleIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (Date.now() - lastActivityRef.current >= idleMs) {
          onIdle();
        } else {
          scheduleIdleTimer();
        }
      }, idleMs);
    };

    const onActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastDebouncedTouchRef.current < ACTIVITY_DEBOUNCE_MS) return;
      lastDebouncedTouchRef.current = now;
      scheduleIdleTimer();
    };

    const onStorage = (e) => {
      if (e.key === 'token' && e.newValue === null) {
        onIdle();
      }
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    window.addEventListener('storage', onStorage);
    scheduleIdleTimer();

    refreshTimerRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current < refreshMs * 1.5) {
        authService.refreshToken().catch(() => {});
      }
    }, refreshMs);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      window.removeEventListener('storage', onStorage);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [enabled, idleMs, refreshMs, onIdle]);
}
