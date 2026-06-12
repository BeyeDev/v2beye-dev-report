import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repo_id } = await request.json();
    if (!repo_id) {
      return NextResponse.json({ success: false, error: "repo_id is required" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    // 1. Fetch monitored repo detail including owner account
    const { data: repo, error: repoErr } = await supabaseAdmin
      .from('monitored_repositories')
      .select('*, github_accounts(*)')
      .eq('repo_id', repo_id)
      .single();

    if (repoErr || !repo) {
      return NextResponse.json({ success: false, error: "Repository not found" }, { status: 404 });
    }

    const githubAccount = repo.github_accounts;
    if (!githubAccount || !githubAccount.encrypted_access_token) {
      return NextResponse.json({ success: false, error: "GitHub account token not found" }, { status: 404 });
    }

    // Decrypt access token
    const token = decrypt(githubAccount.encrypted_access_token);
    const repoName = repo.repo_name; // format: owner/name

    // 2. Fetch commits from GitHub
    const commitsResponse = await fetch(`https://api.github.com/repos/${repoName}/commits?per_page=30`, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'MCK-DevReport-Sync'
      }
    });

    let commitsCount = 0;
    if (commitsResponse.ok) {
      const commitsData = await commitsResponse.json();
      if (Array.isArray(commitsData)) {
        // Upsert commits into database
        for (const c of commitsData) {
          const authorName = c.author?.login || c.commit.author?.name || 'Unknown';
          const { error: commitErr } = await supabaseAdmin
            .from('commits')
            .upsert([{
              repo_id: repo_id,
              sha: c.sha.substring(0, 8),
              message: c.commit.message.split('\n')[0],
              author_username: authorName,
              additions: c.stats?.additions || 0,
              deletions: c.stats?.deletions || 0,
              commit_date: c.commit.author.date,
              branch_name: 'main'
            }], { onConflict: 'sha' });
          if (!commitErr) commitsCount++;
        }
      }
    }

    // 3. Fetch PRs from GitHub
    const prsResponse = await fetch(`https://api.github.com/repos/${repoName}/pulls?state=all&per_page=15`, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'MCK-DevReport-Sync'
      }
    });

    if (prsResponse.ok) {
      const prsData = await prsResponse.json();
      if (Array.isArray(prsData)) {
        // Upsert PRs into database
        for (const p of prsData) {
          await supabaseAdmin
            .from('pull_requests')
            .upsert([{
              repo_id: repo_id,
              number: p.number,
              title: p.title,
              state: p.state === 'closed' && p.merged_at ? 'merged' : p.state,
              creator_username: p.user.login,
              created_at: p.created_at,
              merged_at: p.merged_at,
              closed_at: p.closed_at
            }], { onConflict: 'repo_id,number' });
        }
      }
    }

    // 4. Update repo's updated_at in monitored_repositories
    await supabaseAdmin
      .from('monitored_repositories')
      .update({ updated_at: new Date().toISOString() })
      .eq('repo_id', repo_id);

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi '${repoName}' berhasil!`,
      commitsCount
    });
  } catch (err: any) {
    console.error("Sync repo error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
