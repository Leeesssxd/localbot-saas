import { useEffect } from 'react';
import { APP_DATA_CHANGED_EVENT } from '../lib/app-events.js';

export function useAppDataRefresh(callback, options = {}) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const handler = () => {
      callback();
    };

    window.addEventListener(APP_DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(APP_DATA_CHANGED_EVENT, handler);
  }, [callback, enabled]);
}
