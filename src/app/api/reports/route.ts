import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decrypt } from '@/lib/crypto';

import { getOrCreateUser } from '@/lib/user';

export async function autoSyncRepoIfNeeded(repo: any) {
  if (!supabaseAdmin) return;
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const lastUpdated = repo.updated_at ? new Date(repo.updated_at).getTime() : 0;
  const now = Date.now();

  // If synced within the last 5 minutes, skip auto-sync to avoid hitting GitHub API limits
  if (now - lastUpdated < FIVE_MINUTES_MS) {
    return;
  }

  const githubAccount = repo.github_accounts;
  if (!githubAccount || !githubAccount.encrypted_access_token) {
    return;
  }

  try {
    const token = decrypt(githubAccount.encrypted_access_token);
    const repoName = repo.repo_name;
    const headers = {
      'Authorization': `token ${token}`,
      'User-Agent': 'MCK-DevReport-Sync'
    };

    // 0. Fetch repo metadata to get default_branch
    let defaultBranch = 'main';
    const repoMetaResponse = await fetch(`https://api.github.com/repos/${repoName}`, { headers });
    if (repoMetaResponse.ok) {
      const repoMeta = await repoMetaResponse.json();
      defaultBranch = repoMeta.default_branch || 'main';
    }

    // 1. Fetch latest commits from GitHub
    const commitsResponse = await fetch(`https://api.github.com/repos/${repoName}/commits?per_page=30`, { headers });

    if (commitsResponse.ok) {
      const commitsData = await commitsResponse.json();
      if (Array.isArray(commitsData)) {
        // Fetch individual stats for the 5 newest commits to get real additions/deletions
        const statsMap: Record<string, { additions: number; deletions: number }> = {};
        const commitsToEnrich = commitsData.slice(0, 5);
        await Promise.all(commitsToEnrich.map(async (c) => {
          try {
            const detailRes = await fetch(`https://api.github.com/repos/${repoName}/commits/${c.sha}`, { headers });
            if (detailRes.ok) {
              const detail = await detailRes.json();
              if (detail.stats) {
                statsMap[c.sha] = { additions: detail.stats.additions || 0, deletions: detail.stats.deletions || 0 };
              }
            }
          } catch { /* skip individual fetch errors */ }
        }));

        for (const c of commitsData) {
          const authorName = c.author?.login || c.commit.author?.name || 'Unknown';
          const stats = statsMap[c.sha] || { additions: 0, deletions: 0 };
          await supabaseAdmin
            .from('commits')
            .upsert([{
              repo_id: repo.repo_id,
              sha: c.sha,
              message: c.commit.message.split('\n')[0],
              author_username: authorName,
              additions: stats.additions,
              deletions: stats.deletions,
              commit_date: c.commit.author.date,
              branch_name: defaultBranch
            }], { onConflict: 'sha' });
        }
      }
    }

    // 2. Fetch latest PRs from GitHub
    const prsResponse = await fetch(`https://api.github.com/repos/${repoName}/pulls?state=all&per_page=15`, { headers });

    if (prsResponse.ok) {
      const prsData = await prsResponse.json();
      if (Array.isArray(prsData)) {
        for (const p of prsData) {
          await supabaseAdmin
            .from('pull_requests')
            .upsert([{
              repo_id: repo.repo_id,
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

    // 2.5 Fetch latest Issues from GitHub
    const issuesResponse = await fetch(`https://api.github.com/repos/${repoName}/issues?state=all&per_page=15`, { headers });

    if (issuesResponse.ok) {
      const issuesData = await issuesResponse.json();
      if (Array.isArray(issuesData)) {
        for (const i of issuesData) {
          // GitHub API returns PRs as issues too, skip if it's a PR
          if (i.pull_request) continue;
          
          await supabaseAdmin
            .from('issues')
            .upsert([{
              repo_id: repo.repo_id,
              number: i.number,
              title: i.title,
              state: i.state,
              assignee_username: i.assignee?.login || null,
              created_at: i.created_at,
              closed_at: i.closed_at
            }], { onConflict: 'repo_id,number' });
        }
      }
    }

    // 3. Update repo's updated_at timestamp in database
    await supabaseAdmin
      .from('monitored_repositories')
      .update({ updated_at: new Date().toISOString() })
      .eq('repo_id', repo.repo_id);

  } catch (err) {
    console.error(`Auto-sync failed for ${repo.repo_name}:`, err);
  }
}

function getDateRange(type: 'daily' | 'weekly' | 'monthly') {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

// GET: Fetch report metadata, commits, PRs, and summary stats
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const typeParam = (searchParams.get('type') || 'daily') as 'daily' | 'weekly' | 'monthly';

  try {
    const role = session.user.role || "Developer";
    const dbUser = await getOrCreateUser(session.user.email, session.user.name || '', role);

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    const { startDate, endDate, startIso, endIso } = getDateRange(typeParam);

    if (role === "Manajemen" || role === "Admin") {
      // --- MANAGEMENT ACCESS ---
      // Fetch all submitted reports for this period
      const { data: reports, error: reportsErr } = await supabaseAdmin
        .from('work_reports')
        .select('*, master_user(nama, email)')
        .eq('type', typeParam)
        .eq('start_date', startDate)
        .eq('end_date', endDate)
        .eq('is_submitted', true);

      if (reportsErr) throw reportsErr;

      // Fetch all monitored repositories that are visible (include encrypted_access_token for auto-sync)
      const { data: repos, error: reposErr } = await supabaseAdmin
        .from('monitored_repositories')
        .select('*, github_accounts(user_id, encrypted_access_token)')
        .eq('is_visible', true);

      if (reposErr) throw reposErr;

      // Auto-sync repositories that haven't been updated in the last 5 minutes
      if (repos && repos.length > 0) {
        await Promise.all(repos.map(repo => autoSyncRepoIfNeeded(repo)));
      }

      const repoIds = repos?.map(r => r.repo_id) || [];

      // Fetch commits and PRs in the date range
      let commitsList: any[] = [];
      let prsList: any[] = [];
      let issuesList: any[] = [];

      if (repoIds.length > 0) {
        let commitsStartIso = startIso;
        let prsStartIso = startIso;
        if (typeParam === 'daily') {
          const d = new Date(startIso);
          d.setDate(d.getDate() - 7);
          commitsStartIso = d.toISOString();
          prsStartIso = d.toISOString();
        }

        const { data: commits, error: commitsErr } = await supabaseAdmin
          .from('commits')
          .select('*')
          .in('repo_id', repoIds)
          .gte('commit_date', commitsStartIso)
          .lte('commit_date', endIso);

        if (commitsErr) throw commitsErr;
        commitsList = commits || [];

        const { data: prs, error: prsErr } = await supabaseAdmin
          .from('pull_requests')
          .select('*')
          .in('repo_id', repoIds)
          .gte('created_at', prsStartIso)
          .lte('created_at', endIso);

        if (prsErr) throw prsErr;
        prsList = prs || [];

        const { data: issues, error: issuesErr } = await supabaseAdmin
          .from('issues')
          .select('*')
          .in('repo_id', repoIds);

        if (issuesErr) throw issuesErr;
        issuesList = issues || [];
      }

      // Calculate bento stats
      const totalCommits = commitsList.length;
      const totalPRs = prsList.length;
      const mergedPRs = prsList.filter(p => p.state === 'merged').length;
      const openIssues = issuesList.filter(i => i.state === 'open').length;
      const closedIssues = issuesList.filter(i => i.state === 'closed').length;

      const completedTasks = mergedPRs + closedIssues;
      // Active bugs: open issues containing "bug", "fix", "error" in their title
      const activeBugsList = issuesList.filter(i => 
        i.state === 'open' && 
        (i.title.toLowerCase().includes('bug') || 
         i.title.toLowerCase().includes('fix') || 
         i.title.toLowerCase().includes('error'))
      );
      const activeBugs = activeBugsList.length;

      // Group active tasks list
      const activeTasks = issuesList.map(i => {
        const repo = repos.find(r => r.repo_id === i.repo_id);
        const difficulty = i.title.toLowerCase().includes('critical') || i.title.toLowerCase().includes('migrasi') ? 5 : 3;
        const type = i.title.toLowerCase().includes('bug') || i.title.toLowerCase().includes('fix') ? 'Bug' : 'Task';
        return {
          id: i.issue_id,
          title: i.title,
          repoName: repo ? repo.repo_name.split('/')[1] : 'Unknown',
          type,
          difficulty,
          state: i.state === 'open' ? 'In Progress' : 'Completed'
        };
      });

      // Calculate Epic repositories progress, sorted by most recent commit first
      const epics = repos.map(repo => {
        const repoIssues = issuesList.filter(i => i.repo_id === repo.repo_id);
        const repoCommits = commitsList.filter(c => c.repo_id === repo.repo_id);
        const total = repoIssues.length;
        const closed = repoIssues.filter(i => i.state === 'closed').length;
        const progress = total > 0 ? Math.round((closed / total) * 100) : (repoCommits.length > 0 ? 100 : 0);

        // Find the latest commit date for sorting
        const latestCommitDate = repoCommits.length > 0
          ? repoCommits.reduce((latest, c) => {
              const d = new Date(c.commit_date).getTime();
              return d > latest ? d : latest;
            }, 0)
          : 0;

        return {
          name: repo.repo_name.split('/')[1],
          owner: repo.repo_name.split('/')[0],
          language: repo.language || 'None',
          progress,
          status: progress === 100 ? 'Completed' : 'In Progress',
          difficulty: repo.language === 'TypeScript' || repo.language === 'JavaScript' ? 4 : 3,
          latestCommitDate,
          commits: repoCommits
            .sort((a, b) => new Date(b.commit_date).getTime() - new Date(a.commit_date).getTime())
            .map(c => ({
              sha: c.sha,
              msg: c.message,
              repo: repo.repo_name,
              additions: c.additions,
              deletions: c.deletions,
              date: c.commit_date,
              author: c.author_username
            }))
        };
      }).sort((a, b) => b.latestCommitDate - a.latestCommitDate);

      const db = supabaseAdmin;
      const userIds = [...new Set(reports.map(r => r.user_id))];
      const { data: allAccounts } = await db
        .from('github_accounts')
        .select('account_id, github_username, user_id')
        .in('user_id', userIds);
      
      const reportsList = reports.map((r) => {
        // Find developer's GitHub usernames and repo IDs
        const userAccounts = allAccounts?.filter(a => a.user_id === r.user_id) || [];
        const accountIds = userAccounts.map(a => a.account_id);
        const usernames = userAccounts.map(a => a.github_username);

        let userRepoIds: string[] = [];
        let repoMap: Record<string, string> = {};
        
        if (accountIds.length > 0) {
          const userRepos = repos?.filter(rp => accountIds.includes(rp.account_id)) || [];
          userRepoIds = userRepos.map(rp => rp.repo_id);
          userRepos.forEach(rp => {
            repoMap[rp.repo_id] = rp.repo_name;
          });
        }

        let userCommitsList: any[] = [];
        let userPrsList: any[] = [];

        if (userRepoIds.length > 0 && usernames.length > 0) {
          userCommitsList = commitsList
            .filter(c => userRepoIds.includes(c.repo_id) && usernames.includes(c.author_username))
            .map(c => ({
              sha: c.sha,
              msg: c.message,
              repo: repoMap[c.repo_id] || 'Unknown Repo',
              additions: c.additions,
              deletions: c.deletions,
              date: c.commit_date
            }));

          userPrsList = prsList
            .filter(p => userRepoIds.includes(p.repo_id) && usernames.includes(p.creator_username))
            .map(p => ({
              number: p.number,
              title: p.title,
              repo: repoMap[p.repo_id] || 'Unknown Repo',
              state: p.state
            }));
        }

        return {
          report_id: r.report_id,
          developer: r.master_user?.nama || r.master_user?.email || 'Developer',
          notes: r.manual_notes,
          blockers: r.auto_summary?.blockers || 'Tidak ada kendala',
          submittedAt: new Date(r.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          commits: userCommitsList,
          prs: userPrsList
        };
      });

      return NextResponse.json({
        success: true,
        isManager: true,
        stats: {
          sprintName: `Sprint ${new Date().getMonth() + 1} (${new Date().getFullYear()})`,
          completedTasks,
          activeBugs,
          progressPercent: totalCommits > 0 ? Math.min(100, Math.round((completedTasks / (completedTasks + openIssues + 1)) * 100)) : 75
        },
        epics: epics,
        activeTasks: activeTasks.slice(0, 10),
        reports: reportsList
      });

    } else {
      // --- DEVELOPER ACCESS ---
      // Fetch user's github accounts
      const { data: accounts, error: accErr } = await supabaseAdmin
        .from('github_accounts')
        .select('account_id')
        .eq('user_id', dbUser.user_id);

      if (accErr) throw accErr;
      const accountIds = accounts?.map(a => a.account_id) || [];

      // Fetch monitored repos
      let repoIds: string[] = [];
      let repoMap: Record<string, string> = {};
      if (accountIds.length > 0) {
        const { data: repos, error: reposErr } = await supabaseAdmin
          .from('monitored_repositories')
          .select('*, github_accounts(*)')
          .in('account_id', accountIds)
          .eq('is_visible', true);

        if (reposErr) throw reposErr;

        // Auto-sync repositories that haven't been updated in the last 5 minutes
        if (repos && repos.length > 0) {
          await Promise.all(repos.map(repo => autoSyncRepoIfNeeded(repo)));
        }

        repoIds = repos?.map(r => r.repo_id) || [];
        repos?.forEach(r => {
          repoMap[r.repo_id] = r.repo_name;
        });
      }

      // Fetch commits in the date range (with a 7-day lookback for daily reports)
      let commitsList: any[] = [];
      let prsList: any[] = [];

      if (repoIds.length > 0) {
        let commitsStartIso = startIso;
        let prsStartIso = startIso;
        if (typeParam === 'daily') {
          const d = new Date(startIso);
          d.setDate(d.getDate() - 7);
          commitsStartIso = d.toISOString();
          prsStartIso = d.toISOString();
        }

        const { data: commits, error: commitsErr } = await supabaseAdmin
          .from('commits')
          .select('*')
          .in('repo_id', repoIds)
          .gte('commit_date', commitsStartIso)
          .lte('commit_date', endIso)
          .order('commit_date', { ascending: false });

        if (commitsErr) throw commitsErr;
        commitsList = commits?.map(c => ({
          sha: c.sha,
          msg: c.message,
          repo: repoMap[c.repo_id] || 'Unknown Repo',
          additions: c.additions,
          deletions: c.deletions,
          date: c.commit_date
        })) || [];

        const { data: prs, error: prsErr } = await supabaseAdmin
          .from('pull_requests')
          .select('*')
          .in('repo_id', repoIds)
          .gte('created_at', prsStartIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false });

        if (prsErr) throw prsErr;
        prsList = prs?.map(p => ({
          number: p.number,
          title: p.title,
          repo: repoMap[p.repo_id] || 'Unknown Repo',
          state: p.state
        })) || [];
      }

      // Get work report from db if exists
      const { data: report, error: reportErr } = await supabaseAdmin
        .from('work_reports')
        .select('*')
        .eq('user_id', dbUser.user_id)
        .eq('type', typeParam)
        .eq('start_date', startDate)
        .eq('end_date', endDate)
        .maybeSingle();

      const defaultNotes = typeParam === 'daily'
        ? "1. Melakukan koordinasi pagi (Daily Standup) terkait migrasi database.\n2. Riset implementasi enkripsi AES-256 pada level Supabase PostgreSQL.\n3. Optimasi performa loading data timeline dengan caching local state."
        : typeParam === 'weekly'
        ? "1. Menyelesaikan migrasi database dan skema Supabase.\n2. Implementasi enkripsi AES-256 pada layer penyimpanan data sensitif.\n3. Menyelesaikan halaman dashboard integrasi laporan kerja harian."
        : "1. Sukses merilis v2 Beye Dev Report ke Server Staging.\n2. Mengintegrasikan multi-akun GitHub dengan token terenkripsi AES-256.\n3. Merancang RBAC (Role Based Access Control) untuk Developer & Manajemen.";

      return NextResponse.json({
        success: true,
        isManager: false,
        commits: commitsList,
        prs: prsList,
        report: {
          manual_notes: report?.manual_notes || defaultNotes,
          blockers: report?.auto_summary?.blockers || "Tidak ada kendala berarti hari ini.",
          is_submitted: report?.is_submitted || false
        }
      });
    }

  } catch (err: any) {
    console.error("GET reports error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Save or submit developer manual notes and blockers
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, manual_notes, blockers, is_submitted } = await request.json();
    if (!type) {
      return NextResponse.json({ success: false, error: "type is required" }, { status: 400 });
    }

    const role = session.user.role || "Developer";
    if (role !== "Developer") {
      return NextResponse.json({ success: false, error: "Only developers can submit reports" }, { status: 403 });
    }

    const dbUser = await getOrCreateUser(session.user.email, session.user.name || '', role);

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    const { startDate, endDate } = getDateRange(type);

    // Fetch user's github accounts to construct auto_summary count
    const { data: accounts } = await supabaseAdmin
      .from('github_accounts')
      .select('account_id')
      .eq('user_id', dbUser.user_id);

    const accountIds = accounts?.map(a => a.account_id) || [];
    let repoIds: string[] = [];
    if (accountIds.length > 0) {
      const { data: repos } = await supabaseAdmin
        .from('monitored_repositories')
        .select('repo_id')
        .in('account_id', accountIds)
        .eq('is_visible', true);
      repoIds = repos?.map(r => r.repo_id) || [];
    }

    let commitsCount = 0;
    let prsCount = 0;
    if (repoIds.length > 0) {
      const { startDate: startD, endDate: endD, startIso, endIso } = getDateRange(type);
      
      let commitsStartIso = startIso;
      let prsStartIso = startIso;
      if (type === 'daily') {
        const d = new Date(startIso);
        d.setDate(d.getDate() - 7);
        commitsStartIso = d.toISOString();
        prsStartIso = d.toISOString();
      }

      const { count: commitsCountResult } = await supabaseAdmin
        .from('commits')
        .select('*', { count: 'exact', head: true })
        .in('repo_id', repoIds)
        .gte('commit_date', commitsStartIso)
        .lte('commit_date', endIso);

      const { count: prsCountResult } = await supabaseAdmin
        .from('pull_requests')
        .select('*', { count: 'exact', head: true })
        .in('repo_id', repoIds)
        .gte('created_at', prsStartIso)
        .lte('created_at', endIso);

      commitsCount = commitsCountResult || 0;
      prsCount = prsCountResult || 0;
    }

    const autoSummary = {
      commitsCount,
      prsCount,
      blockers: blockers || "Tidak ada kendala"
    };

    // Check if report already exists for this date range
    const { data: existingReport } = await supabaseAdmin
      .from('work_reports')
      .select('report_id')
      .eq('user_id', dbUser.user_id)
      .eq('type', type)
      .eq('start_date', startDate)
      .eq('end_date', endDate)
      .maybeSingle();

    if (existingReport) {
      const { error: updateErr } = await supabaseAdmin
        .from('work_reports')
        .update({
          manual_notes,
          auto_summary: autoSummary,
          is_submitted: !!is_submitted,
          updated_at: new Date().toISOString()
        })
        .eq('report_id', existingReport.report_id);

      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from('work_reports')
        .insert([{
          user_id: dbUser.user_id,
          type,
          start_date: startDate,
          end_date: endDate,
          auto_summary: autoSummary,
          manual_notes,
          is_submitted: !!is_submitted
        }]);

      if (insertErr) throw insertErr;
    }

    return NextResponse.json({
      success: true,
      message: is_submitted ? "Laporan berhasil dikirim ke manajemen!" : "Laporan berhasil disimpan sebagai draf!"
    });

  } catch (err: any) {
    console.error("POST reports error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
