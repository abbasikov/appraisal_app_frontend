import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 1023px)';

const getInitial = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_QUERY).matches
    : false;

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(getInitial);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }, []);

  return isMobile;
}
