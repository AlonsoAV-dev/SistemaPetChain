import { checkDatabaseConnection, pool, query } from '../src/config/database.js';

try {
  await checkDatabaseConnection();

  const result = await query(
    `SELECT to_regclass('public.users') AS users,
            to_regclass('public.publications') AS publications,
            to_regclass('storage.buckets') AS storage_buckets`,
  );
  const schema = result.rows[0];

  if (!schema.users || !schema.publications || !schema.storage_buckets) {
    throw new Error('La migracion de Supabase no esta completa.');
  }

  console.log('Backend database smoke test passed');
} finally {
  await pool.end();
}
