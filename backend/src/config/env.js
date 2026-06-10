import 'dotenv/config';
// config/env.js
// Single source of truth for all environment variables.
// Fails fast on startup if required vars are missing.


function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optional(name, defaultValue) {
  return process.env[name] ?? defaultValue;
}

const env = {
  port: parseInt(optional('PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  isDev: optional('NODE_ENV', 'development') === 'development',

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  ai: {
    provider: optional('AI_PROVIDER', 'groq'),
    groqApiKey: optional('GROQ_API_KEY', ''),
    groqModel: optional('GROQ_MODEL', 'llama-3.1-8b-instant'),
    groqTimeoutMs: parseInt(optional('GROQ_TIMEOUT_MS', '10000'), 10),
    geminiApiKey: optional('GEMINI_API_KEY', ''),
    geminiModel: optional('GEMINI_MODEL', 'gemini-3.1-flash-lite'),
  },

  meta: {
    apiUrl: optional('META_WHATSAPP_API_URL', 'https://graph.facebook.com/v19.0'),
  },

  frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),
  logLevel: optional('LOG_LEVEL', 'info'),
};

export default env;
