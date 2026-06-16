import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const storageClient =
  env.supabaseUrl && env.supabaseSecretKey
    ? createClient(env.supabaseUrl, env.supabaseSecretKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
