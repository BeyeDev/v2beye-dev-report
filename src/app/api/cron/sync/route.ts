import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { autoSyncRepoIfNeeded } from '@/app/api/reports/route';

export async function GET(request: Request) {
  // Verifikasi request cron (opsional: periksa API key khusus)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server database not configured' }, { status: 500 });
    }

    // 1. Ambil semua repo yang dimonitor beserta token
    const { data: repos, error } = await supabaseAdmin
      .from('monitored_repositories')
      .select('*, github_accounts(user_id, encrypted_access_token)')
      .eq('is_visible', true);

    if (error) throw error;

    if (!repos || repos.length === 0) {
      return NextResponse.json({ success: true, message: 'No monitored repositories found' });
    }

    // 2. Lakukan sinkronisasi untuk setiap repo
    // Gunakan Promise.allSettled agar jika satu gagal, yang lain tetap jalan
    const results = await Promise.allSettled(
      repos.map(async (repo) => {
        // Paksa sync meskipun belum 5 menit dengan menghapus property updated_at
        const repoForSync = { ...repo, updated_at: null };
        await autoSyncRepoIfNeeded(repoForSync);
        return repo.repo_name;
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({ 
      success: true, 
      message: `Cron sync completed. ${successful} succeeded, ${failed} failed.`,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('Cron sync error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
