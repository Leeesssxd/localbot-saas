import { handleSearch } from './search.controller.js';

export default async function searchRoutes(fastify) {
  fastify.get('/search', { preHandler: [fastify.authenticate] }, handleSearch);
}
