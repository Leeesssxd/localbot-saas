// store/tenant.store.js
// Tenant configuration state shared across dashboard components.

import { create } from 'zustand';
import client from '../api/client.js';
import { notifyAppDataChanged } from '../lib/app-events.js';

export const useTenantStore = create((set, get) => ({
  tenant: null,
  loading: false,
  error: null,

  fetchTenant: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await client.get('/tenants/me');
      set({ tenant: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  toggleBot: async () => {
    const current = get().tenant;
    if (!current) return;

    const optimistic = !current.businessOpen;
    set({ tenant: { ...current, businessOpen: optimistic } });

    try {
      const { data } = await client.put('/tenants/me', { businessOpen: optimistic });
      set({ tenant: { ...get().tenant, ...data } });
      notifyAppDataChanged({ type: 'tenant', action: 'toggle' });
    } catch {
      // Revert on failure
      set({ tenant: { ...get().tenant, businessOpen: current.businessOpen } });
      notifyAppDataChanged({ type: 'tenant', action: 'toggle-revert' });
    }
  },

  updateTenant: async (fields) => {
    const { data } = await client.put('/tenants/me', fields);
    set({ tenant: { ...get().tenant, ...data } });
    notifyAppDataChanged({ type: 'tenant', action: 'update' });
    return data;
  },
}));
