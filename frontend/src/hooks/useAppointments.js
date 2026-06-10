// hooks/useAppointments.js

import { useState, useCallback } from 'react';
import client from '../api/client.js';

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async (from, to) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (from) params.from = from instanceof Date ? from.toISOString() : from;
      if (to) params.to = to instanceof Date ? to.toISOString() : to;
      const { data } = await client.get('/appointments', { params });
      setAppointments(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAppointment = useCallback(async (id, status, notes) => {
    const { data } = await client.patch(`/appointments/${id}`, { status, notes });
    setAppointments((prev) => prev.map((a) => (a.id === id ? data : a)));
    return data;
  }, []);

  const createAppointment = useCallback(async (payload) => {
    const { data } = await client.post('/appointments', payload);
    setAppointments((prev) => [...prev, data]);
    return data;
  }, []);

  return { appointments, loading, error, fetchAppointments, updateAppointment, createAppointment };
}
