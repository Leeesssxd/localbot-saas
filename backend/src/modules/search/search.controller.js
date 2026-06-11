import { searchTenantData } from './search.service.js';

export async function handleSearch(request) {
  const tenantId = request.user?.tenantId;
  const query = request.query?.q ?? '';

  if (!tenantId) {
    throw new Error('Tenant context missing');
  }

  return searchTenantData(tenantId, query);
}
