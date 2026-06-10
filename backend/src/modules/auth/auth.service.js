// modules/auth/auth.service.js
// JWT authentication with access tokens (15min) + refresh tokens (7 days, rotated).

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../shared/db.js';
import env from '../../config/env.js';
import { UnauthorizedError } from '../../shared/errors.js';

const accessSecret = new TextEncoder().encode(env.jwt.accessSecret);
const refreshSecret = new TextEncoder().encode(env.jwt.refreshSecret);

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES_DAYS = 7;

// ── Token generation ────────────────────────────────────────────────────────

export async function signAccessToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRES)
    .sign(accessSecret);
}

export async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

// ── Login ───────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });

  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  // Check tenant status — suspended tenants cannot log in
  if (user.tenant.status === 'SUSPENDED' || user.tenant.status === 'CANCELLED') {
    throw new UnauthorizedError('Account is suspended. Contact support.');
  }

  const accessToken = await signAccessToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });

  const refreshToken = await createRefreshToken(user.id);

  return {
    accessToken,
    refreshToken: refreshToken.token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
  };
}

// ── Refresh token management ────────────────────────────────────────────────

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

  return prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
}

export async function refreshAccessToken(rawToken) {
  const record = await prisma.refreshToken.findUnique({
    where: { token: rawToken },
    include: { user: { include: { tenant: true } } },
  });

  if (!record) throw new UnauthorizedError('Invalid refresh token');
  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: record.id } });
    throw new UnauthorizedError('Refresh token expired');
  }

  // Rotate: invalidate old, issue new
  await prisma.refreshToken.delete({ where: { id: record.id } });
  const newRefresh = await createRefreshToken(record.userId);

  const accessToken = await signAccessToken({
    userId: record.user.id,
    tenantId: record.user.tenantId,
    role: record.user.role,
  });

  return {
    accessToken,
    refreshToken: newRefresh.token,
  };
}

export async function logout(rawToken) {
  if (!rawToken) return;
  await prisma.refreshToken.deleteMany({ where: { token: rawToken } }).catch(() => {});
}
