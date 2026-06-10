// modules/services/services.routes.js

import { getServices, postService, putService, deleteService } from './services.controller.js';

export default async function servicesRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] };

  fastify.get('/services', auth, getServices);
  fastify.post('/services', auth, postService);
  fastify.put('/services/:id', auth, putService);
  fastify.delete('/services/:id', auth, deleteService);
}
