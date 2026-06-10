// modules/tenants/tenants.routes.js

import {
  getMyTenant,
  updateMyTenant,
  getMySchedule,
  updateMySchedule,
} from './tenants.controller.js';

export default async function tenantsRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] };

  fastify.get('/tenants/me', auth, getMyTenant);
  fastify.put('/tenants/me', auth, updateMyTenant);
  fastify.get('/tenants/me/schedule', auth, getMySchedule);
  fastify.put('/tenants/me/schedule', auth, updateMySchedule);
}
