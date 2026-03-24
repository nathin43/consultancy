import { useEffect, useRef } from 'react';

const DEFAULT_EVENT_NAMES = [
  'report:data-changed',
  'order-placed',
  'order-cancelled',
  'refund-approved',
  'payment-completed',
  'stock-updated',
];

const useReportAutoRefresh = (refreshFn, options = {}) => {
  const {
    intervalMs = 10000,
    enabled = true,
    eventNames = DEFAULT_EVENT_NAMES,
  } = options;
  const refreshRef = useRef(refreshFn);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    const runRefresh = async () => {
      if (isRefreshingRef.current || typeof refreshRef.current !== 'function') {
        return;
      }

      isRefreshingRef.current = true;
      try {
        await refreshRef.current();
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const intervalId = window.setInterval(runRefresh, intervalMs);
    const handleFocus = () => runRefresh();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runRefresh();
      }
    };
    const handleDataChanged = () => runRefresh();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    eventNames.forEach((eventName) => {
      window.addEventListener(eventName, handleDataChanged);
    });

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      eventNames.forEach((eventName) => {
        window.removeEventListener(eventName, handleDataChanged);
      });
    };
  }, [enabled, intervalMs, eventNames]);
};

export default useReportAutoRefresh;
