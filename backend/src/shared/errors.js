// shared/errors.js
// Domain-specific error classes. The Fastify error handler maps these to HTTP codes.

export class SlotUnavailableError extends Error {
  constructor(slot) {
    super(`El horario ${slot} ya no está disponible.`);
    this.name = 'SlotUnavailableError';
    this.statusCode = 409;
  }
}

export class AITimeoutError extends Error {
  constructor() {
    super('Groq AI request timed out.');
    this.name = 'AITimeoutError';
    this.statusCode = 504;
  }
}

export class AIProviderError extends Error {
  constructor(message) {
    super(message ?? 'AI provider returned an error.');
    this.name = 'AIProviderError';
    this.statusCode = 502;
  }
}

export class TenantSuspendedError extends Error {
  constructor() {
    super('Tenant account is suspended.');
    this.name = 'TenantSuspendedError';
    this.statusCode = 403;
  }
}

export class InvalidSignatureError extends Error {
  constructor() {
    super('Invalid webhook signature.');
    this.name = 'InvalidSignatureError';
    this.statusCode = 401;
  }
}

export class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource ?? 'Resource'} not found.`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class UnauthorizedError extends Error {
  constructor(msg) {
    super(msg ?? 'Unauthorized.');
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('Access denied.');
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

export class PastDateError extends Error {
  constructor() {
    super('Cannot book appointments in the past.');
    this.name = 'PastDateError';
    this.statusCode = 400;
  }
}
