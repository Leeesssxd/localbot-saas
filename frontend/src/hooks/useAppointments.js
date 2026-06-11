// hooks/useAppointments.js

import { useState, useCallback } from 'react';
import client from '../api/client.js';
import { notifyAppDataChanged } from '../lib/app-events.js';

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
    notifyAppDataChanged({ type: 'appointment', action: 'update', id });
    return data;
  }, []);

  const rescheduleAppointment = useCallback(async (id, scheduledAt, notes) => {
    const { data } = await client.patch(`/appointments/${id}/reschedule`, { scheduledAt, notes });
    setAppointments((prev) => prev.map((a) => (a.id === id ? data : a)));
    notifyAppDataChanged({ type: 'appointment', action: 'reschedule', id });
    return data;
  }, []);

  const createAppointment = useCallback(async (payload) => {
    const { data } = await client.post('/appointments', payload);
    setAppointments((prev) => [...prev, data]);
    notifyAppDataChanged({ type: 'appointment', action: 'create', id: data.id });
    return data;
  }, []);

  return { appointments, loading, error, fetchAppointments, updateAppointment, rescheduleAppointment, createAppointment };
}
