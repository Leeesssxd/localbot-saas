// modules/auth/jwt.plugin.js
// Fastify plugin: decorates fastify with `authenticate` preHandler hook.
// Usage: fastify.get('/route', { preHandler: [fastify.authenticate] }, handler)

import fp from 'fastify-plugin';
import { verifyAccessToken } from './auth.service.js';

async function jwtPlugin(fastify) {
  fastify.decorate('authenticate', async function (request, reply) {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing authorization header' });
    }

    const token = auth.slice(7);
    try {
      const payload = await verifyAccessToken(token);
      request.user = payload; // { userId, tenantId, role }
    } catch (err) {
      return reply.code(401).send({ error: err.message });
    }
  });
}

// Export as Fastify plugin (fp wraps it to avoid scoping issues)
export default fp(jwtPlugin);
