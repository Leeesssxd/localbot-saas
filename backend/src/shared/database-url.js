function isSupabaseHost(hostname) {
  return typeof hostname === 'string' && hostname.endsWith('supabase.co');
}

export function normalizeDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    return { url: rawUrl, changed: false, reason: '' };
  }

  const parsed = new URL(rawUrl);
  if (isSupabaseHost(parsed.hostname) && !parsed.searchParams.has('sslmode')) {
    parsed.searchParams.set('sslmode', 'require');
    return {
      url: parsed.toString(),
      changed: true,
      reason: 'added sslmode=require for Supabase',
    };
  }

  return { url: parsed.toString(), changed: false, reason: '' };
}

export function describeDatabaseUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    user: decodeURIComponent(parsed.username || ''),
    database: parsed.pathname.replace(/^\//, ''),
    sslmode: parsed.searchParams.get('sslmode') || '',
  };
}
