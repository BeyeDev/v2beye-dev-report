import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

// Helper untuk memverifikasi signature webhook GitHub
function verifySignature(payload: string, signature: string, secret: string) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';
    const event = request.headers.get('x-github-event') || '';
    
    // Webhook secret dari env var (opsional untuk local, wajib untuk prod)
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    
    if (secret && signature && !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const repoFullName = payload.repository?.full_name;
    
    if (!repoFullName) {
      return NextResponse.json({ error: 'No repository info' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server database not configured' }, { status: 500 });
    }

    // Cari repo di database
    const { data: repo } = await supabaseAdmin
      .from('monitored_repositories')
      .select('repo_id')
      .eq('repo_name', repoFullName)
      .maybeSingle();

    if (!repo) {
      return NextResponse.json({ message: 'Repository not monitored' }, { status: 200 });
    }

    // Proses berdasarkan event type
    if (event === 'push') {
      const branchName = payload.ref ? payload.ref.replace('refs/heads/', '') : 'main';
      const commits = payload.commits || [];
      
      for (const commit of commits) {
        // Kita perlu fetch stats individual jika additions/deletions tidak ada di payload push
        // Note: payload push biasanya punya added, removed, modified files, tapi kita hitung manual
        const additions = commit.added?.length || 0;
        const deletions = commit.removed?.length || 0;
        const modified = commit.modified?.length || 0;
        // Asumsi kasar jika stats detail tidak tersedia di payload
        const authorUsername = commit.author?.username || commit.author?.name || 'Unknown';
        
        await supabaseAdmin
          .from('commits')
          .upsert([{
            repo_id: repo.repo_id,
            sha: commit.id,
            message: commit.message.split('\n')[0],
            author_username: authorUsername,
            additions: additions + modified, // estimasi kasar
            deletions: deletions,
            commit_date: commit.timestamp,
            branch_name: branchName
          }], { onConflict: 'sha' });
      }
    } 
    else if (event === 'pull_request') {
      const pr = payload.pull_request;
      await supabaseAdmin
        .from('pull_requests')
        .upsert([{
          repo_id: repo.repo_id,
          number: pr.number,
          title: pr.title,
          state: pr.state === 'closed' && pr.merged_at ? 'merged' : pr.state,
          creator_username: pr.user.login,
          created_at: pr.created_at,
          merged_at: pr.merged_at,
          closed_at: pr.closed_at
        }], { onConflict: 'repo_id,number' });
    }
    else if (event === 'issues') {
      const issue = payload.issue;
      await supabaseAdmin
        .from('issues')
        .upsert([{
          repo_id: repo.repo_id,
          number: issue.number,
          title: issue.title,
          state: issue.state,
          assignee_username: issue.assignee?.login || null,
          created_at: issue.created_at,
          closed_at: issue.closed_at
        }], { onConflict: 'repo_id,number' });
    }

    // Update repository timestamp
    await supabaseAdmin
      .from('monitored_repositories')
      .update({ updated_at: new Date().toISOString() })
      .eq('repo_id', repo.repo_id);

    return NextResponse.json({ success: true });
    
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
