import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getOrCreateUser(email: string, name: string, role: string) {
  if (!supabaseAdmin) throw new Error("Supabase Admin client not configured");

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('master_user')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (existing) return existing;

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('master_user')
    .insert([{ email, nama: name || email.split('@')[0], role, status_aktif: true }])
    .select()
    .single();

  if (insertErr) throw insertErr;
  return inserted;
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
  const typeParam = searchParams.get('type') as 'daily' | 'weekly' | 'monthly' || 'daily';

  try {
    const role = (session.user as any).role || "Developer";
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

      // Fetch all monitored repositories that are visible
      const { data: repos, error: reposErr } = await supabaseAdmin
        .from('monitored_repositories')
        .select('*, github_accounts(user_id)')
        .eq('is_visible', true);

      if (reposErr) throw reposErr;
      const repoIds = repos?.map(r => r.repo_id) || [];

      // Fetch commits and PRs in the date range
      let commitsList: any[] = [];
      let prsList: any[] = [];
      let issuesList: any[] = [];

      if (repoIds.length > 0) {
        const { data: commits, error: commitsErr } = await supabaseAdmin
          .from('commits')
          .select('*')
          .in('repo_id', repoIds)
          .gte('commit_date', startIso)
          .lte('commit_date', endIso);

        if (commitsErr) throw commitsErr;
        commitsList = commits || [];

        const { data: prs, error: prsErr } = await supabaseAdmin
          .from('pull_requests')
          .select('*')
          .in('repo_id', repoIds)
          .gte('created_at', startIso)
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

      // Calculate Epic repositories progress
      const epics = repos.map(repo => {
        const repoIssues = issuesList.filter(i => i.repo_id === repo.repo_id);
        const repoCommits = commitsList.filter(c => c.repo_id === repo.repo_id);
        const total = repoIssues.length;
        const closed = repoIssues.filter(i => i.state === 'closed').length;
        const progress = total > 0 ? Math.round((closed / total) * 100) : (repoCommits.length > 0 ? 100 : 0);
        return {
          name: repo.repo_name.split('/')[1],
          owner: repo.repo_name.split('/')[0],
          language: repo.language || 'None',
          progress,
          status: progress === 100 ? 'Completed' : 'In Progress',
          difficulty: repo.language === 'TypeScript' || repo.language === 'JavaScript' ? 4 : 3
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
        epics: epics.slice(0, 4),
        activeTasks: activeTasks.slice(0, 10),
        reports: reports.map(r => ({
          report_id: r.report_id,
          developer: r.master_user?.nama || r.master_user?.email || 'Developer',
          notes: r.manual_notes,
          blockers: r.auto_summary?.blockers || 'Tidak ada kendala',
          submittedAt: new Date(r.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        }))
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
          .select('repo_id, repo_name')
          .in('account_id', accountIds);

        if (reposErr) throw reposErr;
        repoIds = repos?.map(r => r.repo_id) || [];
        repos?.forEach(r => {
          repoMap[r.repo_id] = r.repo_name;
        });
      }

      // Fetch commits in the date range
      let commitsList: any[] = [];
      let prsList: any[] = [];

      if (repoIds.length > 0) {
        const { data: commits, error: commitsErr } = await supabaseAdmin
          .from('commits')
          .select('*')
          .in('repo_id', repoIds)
          .gte('commit_date', startIso)
          .lte('commit_date', endIso)
          .order('commit_date', { ascending: false });

        if (commitsErr) throw commitsErr;
        commitsList = commits?.map(c => ({
          sha: c.sha,
          msg: c.message,
          repo: repoMap[c.repo_id] || 'Unknown Repo',
          additions: c.additions,
          deletions: c.deletions
        })) || [];

        const { data: prs, error: prsErr } = await supabaseAdmin
          .from('pull_requests')
          .select('*')
          .in('repo_id', repoIds)
          .gte('created_at', startIso)
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

    const role = (session.user as any).role || "Developer";
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
        .in('account_id', accountIds);
      repoIds = repos?.map(r => r.repo_id) || [];
    }

    let commitsCount = 0;
    let prsCount = 0;
    if (repoIds.length > 0) {
      const { startDate: startD, endDate: endD, startIso, endIso } = getDateRange(type);

      const { count: commitsCountResult } = await supabaseAdmin
        .from('commits')
        .select('*', { count: 'exact', head: true })
        .in('repo_id', repoIds)
        .gte('commit_date', startIso)
        .lte('commit_date', endIso);

      const { count: prsCountResult } = await supabaseAdmin
        .from('pull_requests')
        .select('*', { count: 'exact', head: true })
        .in('repo_id', repoIds)
        .gte('created_at', startIso)
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
