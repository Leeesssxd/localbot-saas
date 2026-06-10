// hooks/useServices.js

import { useState, useCallback } from 'react';
import client from '../api/client.js';

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.get('/services');
      setServices(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createService = useCallback(async (payload) => {
    const { data } = await client.post('/services', payload);
    setServices((prev) => [...prev, data]);
    return data;
  }, []);

  const updateService = useCallback(async (id, payload) => {
    const { data } = await client.put(`/services/${id}`, payload);
    setServices((prev) => prev.map((s) => (s.id === id ? data : s)));
    return data;
  }, []);

  const deleteService = useCallback(async (id) => {
    await client.delete(`/services/${id}`);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { services, loading, error, fetchServices, createService, updateService, deleteService };
}
