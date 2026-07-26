// Debug endpoint — returns env var availability (no values)
// DELETE after debugging
export default async function handler(req, res) {
  const check = [
    'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY',
    'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING', 'POSTGRES_HOST',
    'INGEST_API_KEY', 'NODE_ENV',
  ];

  const result = {};
  for (const k of check) {
    const v = process.env[k];
    result[k] = v ? `SET (length=${v.length})` : 'NOT SET';
  }

  // Try creating supabase client
  let clientStatus = 'unknown';
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      clientStatus = `missing: url=${!!url}, key=${!!key}`;
    } else {
      const sb = createClient(url, key);
      const { data, error } = await sb.from('backtest_config').select('key').limit(1);
      clientStatus = error ? `query_error: ${error.message}` : `ok: ${JSON.stringify(data)}`;
    }
  } catch (err) {
    clientStatus = `crash: ${err.message}`;
  }

  res.status(200).json({ env: result, supabase_client: clientStatus });
}
