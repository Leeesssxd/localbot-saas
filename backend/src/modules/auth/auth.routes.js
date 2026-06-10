// modules/auth/auth.routes.js

import { handleLogin, handleRefresh, handleLogout } from './auth.controller.js';

export default async function authRoutes(fastify) {
  fastify.post('/auth/login', handleLogin);
  fastify.post('/auth/refresh', handleRefresh);
  fastify.post('/auth/logout', handleLogout);
}
