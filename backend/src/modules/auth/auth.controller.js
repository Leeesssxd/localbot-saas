// modules/auth/auth.controller.js

import { login, refreshAccessToken, logout } from './auth.service.js';

export async function handleLogin(request, reply) {
  const { email, password } = request.body;

  if (!email || !password) {
    return reply.code(400).send({ error: 'Email and password are required' });
  }

  const result = await login(email, password);

  // Set refresh token as httpOnly cookie for security
  reply.setCookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });

  return reply.send({
    accessToken: result.accessToken,
    user: result.user,
  });
}

export async function handleRefresh(request, reply) {
  const token = request.cookies?.refreshToken;

  if (!token) {
    return reply.code(401).send({ error: 'No refresh token' });
  }

  const result = await refreshAccessToken(token);

  reply.setCookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  });

  return reply.send({ accessToken: result.accessToken });
}

export async function handleLogout(request, reply) {
  const token = request.cookies?.refreshToken;
  await logout(token);

  reply.clearCookie('refreshToken', { path: '/auth/refresh' });
  return reply.send({ message: 'Logged out' });
}
