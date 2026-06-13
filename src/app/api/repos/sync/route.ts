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

    const { data: dbUser } = await supabaseAdmin
      .from('master_user')
      .select('user_id')
      .eq('email', session.user.email)
      .single();

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
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

    if (githubAccount.user_id !== dbUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your repository" }, { status: 403 });
    }

    // Decrypt access token
    let token = '';
    try {
      token = decrypt(githubAccount.encrypted_access_token);
    } catch (decryptErr: any) {
      console.error("Token decryption failed:", decryptErr);
      return NextResponse.json({
        success: false,
        error: "Gagal mendekripsi token GitHub Anda. Kunci enkripsi (DATA_ENCRYPTION_KEY) di server telah berubah atau tidak cocok. Silakan hubungkan kembali akun GitHub Anda di halaman Akun."
      }, { status: 400 });
    }
    const repoName = repo.repo_name; // format: owner/name
    const headers = {
      'Authorization': `token ${token}`,
      'User-Agent': 'MCK-DevReport-Sync'
    };

    // 1.5 Fetch repo metadata to get default_branch
    let defaultBranch = 'main';
    const repoMetaResponse = await fetch(`https://api.github.com/repos/${repoName}`, { headers });
    if (repoMetaResponse.ok) {
      const repoMeta = await repoMetaResponse.json();
      defaultBranch = repoMeta.default_branch || 'main';
    }

    // 2. Fetch commits from GitHub with pagination (max 5 pages = 500 commits per sync to avoid rate limits)
    let commitsCount = 0;
    let commitsPage = 1;
    let hasMoreCommits = true;
    let allCommitShas: string[] = [];

    while (hasMoreCommits && commitsPage <= 5) {
      const commitsResponse = await fetch(`https://api.github.com/repos/${repoName}/commits?per_page=100&page=${commitsPage}`, { headers });

      if (commitsResponse.ok) {
        const commitsData = await commitsResponse.json();
        if (Array.isArray(commitsData) && commitsData.length > 0) {
          // Track SHAs for stats enrichment
          commitsData.forEach((c: any) => allCommitShas.push(c.sha));

          // Batch Upsert commits into database (initially with 0 additions/deletions)
          const commitUpserts = commitsData.map((c: any) => ({
            repo_id: repo_id,
            sha: c.sha,
            message: c.commit.message.split('\n')[0],
            author_username: c.author?.login || c.commit.author?.name || 'Unknown',
            additions: 0,
            deletions: 0,
            commit_date: c.commit.author.date,
            branch_name: defaultBranch
          }));
          const { error: commitErr } = await supabaseAdmin
            .from('commits')
            .upsert(commitUpserts, { onConflict: 'sha' });
          if (!commitErr) commitsCount += commitUpserts.length;
          if (commitsData.length < 100) hasMoreCommits = false;
          else commitsPage++;
        } else {
          hasMoreCommits = false;
        }
      } else {
        hasMoreCommits = false;
        console.error(`Failed to fetch commits page ${commitsPage}`);
      }
    }

    // 2.5 Enrich the 10 newest commits with real additions/deletions stats
    const topShas = allCommitShas.slice(0, 10);
    if (topShas.length > 0) {
      await Promise.all(topShas.map(async (sha) => {
        try {
          const detailRes = await fetch(`https://api.github.com/repos/${repoName}/commits/${sha}`, { headers });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.stats) {
              await supabaseAdmin!
                .from('commits')
                .update({ additions: detail.stats.additions || 0, deletions: detail.stats.deletions || 0 })
                .eq('sha', sha);
            }
          }
        } catch { /* skip individual fetch errors */ }
      }));
    }

    // 3. Fetch PRs from GitHub with pagination (max 3 pages = 300 PRs per sync)
    let prsPage = 1;
    let hasMorePrs = true;

    while (hasMorePrs && prsPage <= 3) {
      const prsResponse = await fetch(`https://api.github.com/repos/${repoName}/pulls?state=all&per_page=100&page=${prsPage}`, { headers });

      if (prsResponse.ok) {
        const prsData = await prsResponse.json();
        if (Array.isArray(prsData) && prsData.length > 0) {
          // Batch Upsert PRs into database
          const prUpserts = prsData.map((p: any) => ({
            repo_id: repo_id,
            number: p.number,
            title: p.title,
            state: p.state === 'closed' && p.merged_at ? 'merged' : p.state,
            creator_username: p.user.login,
            created_at: p.created_at,
            merged_at: p.merged_at,
            closed_at: p.closed_at
          }));
          await supabaseAdmin
            .from('pull_requests')
            .upsert(prUpserts, { onConflict: 'repo_id,number' });
          if (prsData.length < 100) hasMorePrs = false;
          else prsPage++;
        } else {
          hasMorePrs = false;
        }
      } else {
        hasMorePrs = false;
        console.error(`Failed to fetch PRs page ${prsPage}`);
      }
    }

    // 3.5 Fetch Issues from GitHub with pagination (max 3 pages = 300 Issues per sync)
    let issuesPage = 1;
    let hasMoreIssues = true;

    while (hasMoreIssues && issuesPage <= 3) {
      const issuesResponse = await fetch(`https://api.github.com/repos/${repoName}/issues?state=all&per_page=100&page=${issuesPage}`, { headers });

      if (issuesResponse.ok) {
        const issuesData = await issuesResponse.json();
        if (Array.isArray(issuesData) && issuesData.length > 0) {
          // Batch Upsert Issues into database
          const issueUpserts = issuesData
            .filter((i: any) => !i.pull_request) // filter out PRs
            .map((i: any) => ({
              repo_id: repo_id,
              number: i.number,
              title: i.title,
              state: i.state,
              assignee_username: i.assignee?.login || null,
              created_at: i.created_at,
              closed_at: i.closed_at
            }));
            
          if (issueUpserts.length > 0) {
            await supabaseAdmin
              .from('issues')
              .upsert(issueUpserts, { onConflict: 'repo_id,number' });
          }
          if (issuesData.length < 100) hasMoreIssues = false;
          else issuesPage++;
        } else {
          hasMoreIssues = false;
        }
      } else {
        hasMoreIssues = false;
        console.error(`Failed to fetch Issues page ${issuesPage}`);
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
