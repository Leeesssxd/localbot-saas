import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import { normalizeDatabaseUrl, describeDatabaseUrl } from '../src/shared/database-url.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

function log(line = '') {
  process.stdout.write(`${line}\n`);
}

function fail(message) {
  log(`ERROR: ${message}`);
  process.exitCode = 1;
}

async function checkTcp(hostname, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: hostname, port, timeout: timeoutMs });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };

    socket.once('connect', () => done({ ok: true }));
    socket.once('timeout', () => done({ ok: false, reason: `TCP timeout after ${timeoutMs}ms` }));
    socket.once('error', (error) => done({ ok: false, reason: error.message }));
  });
}

async function main() {
  log('LocalBot backend doctor');
  log('-----------------------');

  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (!rawDatabaseUrl) {
    fail('DATABASE_URL is missing in backend/.env');
    return;
  }
  if (/TU_PASSWORD_PRISMA|REPLACE_WITH/i.test(rawDatabaseUrl)) {
    fail('DATABASE_URL still contains a placeholder password. Replace TU_PASSWORD_PRISMA with the real Supabase pooler password.');
    return;
  }

  try {
    new URL(rawDatabaseUrl);
  } catch {
    fail('DATABASE_URL is not a valid PostgreSQL URL');
    return;
  }

  const normalized = normalizeDatabaseUrl(rawDatabaseUrl);
  const details = describeDatabaseUrl(normalized.url);
  log(`Database host: ${details.host}:${details.port}`);
  log(`Database user: ${details.user || '(none)'}`);
  log(`Database name: ${details.database || '(none)'}`);
  log(`SSL mode: ${details.sslmode || '(default)'}`);
  if (normalized.changed) {
    log('WARN: Added sslmode=require automatically for Supabase.');
  }

  try {
    const lookupResult = await lookup(details.host, { all: true });
    const addresses = lookupResult.map((entry) => entry.address);
    log(`DNS addresses: ${addresses.join(', ')}`);
  } catch (error) {
    fail(`DNS lookup failed for ${details.host}: ${error.message}`);
    return;
  }

  const tcp = await checkTcp(details.host, details.port);
  if (!tcp.ok) {
    fail(`Database port ${details.port} is not reachable: ${tcp.reason}`);
    log('Hint: the direct Supabase host is IPv6-only. If your network is IPv4-only, switch DATABASE_URL to the Supabase session pooler (aws-0-us-east-1.pooler.supabase.com:5432) or enable the IPv4 add-on on the project.');
    return;
  }

  log('Database TCP connectivity looks OK.');

  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    fail('JWT secrets are missing. Check backend/.env against .env.example');
    return;
  }

  log('Environment variables look populated.');
}

await main();
