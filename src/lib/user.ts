import { supabaseAdmin } from './supabase';

export async function getOrCreateUser(email: string, name: string, role: string) {
  if (!supabaseAdmin) throw new Error("Supabase Admin client not configured");

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('master_user')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (existing) return existing;

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('master_user')
    .insert([{ email, nama: name || email.split('@')[0], role, status_aktif: true }])
    .select()
    .single();

  if (insertErr) throw insertErr;
  return inserted;
}
