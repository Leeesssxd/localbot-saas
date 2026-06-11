import { useCallback, useState } from 'react';
import client from '../api/client.js';

export function useAnalytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.get('/analytics/summary');
      setSummary(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, loading, error, fetchSummary, setSummary };
}
