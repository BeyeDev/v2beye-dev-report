import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  console.warn("Peringatan: NEXT_PUBLIC_SUPABASE_URL belum diisi di berkas .env.local");
}

// Client umum untuk interaksi client-side (dengan RLS aktif)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin untuk operasi server-side (membypass RLS)
// Hanya diinisialisasi jika dijalankan di server-side (Node.js environment)
export const supabaseAdmin = typeof window === 'undefined' && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;
