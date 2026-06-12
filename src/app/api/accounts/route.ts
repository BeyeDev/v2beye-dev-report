import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { encrypt, decrypt } from '@/lib/crypto';

import { getOrCreateUser } from '@/lib/user';

// GET: Fetch connected accounts and monitored repositories
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const role = session.user.role || "Developer";
    const dbUser = await getOrCreateUser(session.user.email, session.user.name || '', role);

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    // Load accounts
    const { data: accounts, error: accErr } = await supabaseAdmin
      .from('github_accounts')
      .select('*')
      .eq('user_id', dbUser.user_id);

    if (accErr) throw accErr;

    // Load repositories
    let repos: any[] = [];
    let commitsCounts: Record<string, number> = {};
    if (accounts && accounts.length > 0) {
      const accountIds = accounts.map(a => a.account_id);
      const { data: repositories, error: repoErr } = await supabaseAdmin
        .from('monitored_repositories')
        .select('*')
        .in('account_id', accountIds);

      if (repoErr) throw repoErr;
      repos = repositories || [];

      if (repos.length > 0) {
        const repoIds = repos.map(r => r.repo_id);
        const { data: commitsCountData } = await supabaseAdmin
          .from('commits')
          .select('repo_id')
          .in('repo_id', repoIds);

        if (commitsCountData) {
          commitsCountData.forEach(c => {
            commitsCounts[c.repo_id] = (commitsCounts[c.repo_id] || 0) + 1;
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      accounts: accounts.map(a => ({
        account_id: a.account_id,
        username: a.github_username,
        avatarUrl: a.github_avatar_url,
        reposCount: repos.filter(r => r.account_id === a.account_id).length,
        status: "Active",
        connectedAt: new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      })),
      repos: repos.map(r => {
        return {
          id: r.repo_id,
          name: r.repo_name.split('/')[1],
          owner: r.repo_name.split('/')[0],
          language: r.language || 'None',
          commitsCount: commitsCounts[r.repo_id] || 0,
          is_visible: r.is_visible,
          lastSynced: r.updated_at && r.updated_at !== r.created_at
            ? new Date(r.updated_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            : "Belum disinkronkan"
        };
      })
    });
  } catch (err: any) {
    console.error("GET accounts error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Connect a new GitHub account
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username, token } = await request.json();
    if (!username || !token) {
      return NextResponse.json({ success: false, error: "Username and token are required" }, { status: 400 });
    }

    // 1. Validate against GitHub API
    const ghUserResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'MCK-DevReport-Sync'
      }
    });

    if (!ghUserResponse.ok) {
      return NextResponse.json({ success: false, error: "Token GitHub tidak valid atau username salah." }, { status: 400 });
    }

    const ghUserData = await ghUserResponse.json();
    const avatarUrl = ghUserData.avatar_url;

    // 2. Fetch User from Supabase
    const role = session.user.role || "Developer";
    const dbUser = await getOrCreateUser(session.user.email, session.user.name || '', role);

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    // Check if account already connected
    const { data: existingAccount } = await supabaseAdmin
      .from('github_accounts')
      .select('*')
      .eq('github_username', username)
      .maybeSingle();

    let accountId = "";
    if (existingAccount) {
      if (existingAccount.user_id !== dbUser.user_id) {
        return NextResponse.json({ success: false, error: "Akun GitHub ini sudah terhubung dengan user lain." }, { status: 403 });
      }
      // Update token
      const { error: updateErr } = await supabaseAdmin
        .from('github_accounts')
        .update({
          encrypted_access_token: encrypt(token),
          github_avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('account_id', existingAccount.account_id);

      if (updateErr) throw updateErr;
      accountId = existingAccount.account_id;
    } else {
      // Insert new account
      const { data: newAccount, error: insertAccErr } = await supabaseAdmin
        .from('github_accounts')
        .insert([{
          user_id: dbUser.user_id,
          github_username: username,
          github_avatar_url: avatarUrl,
          encrypted_access_token: encrypt(token)
        }])
        .select()
        .single();

      if (insertAccErr) throw insertAccErr;
      accountId = newAccount.account_id;
    }

    // 3. Fetch User Repositories from GitHub API with pagination
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const reposResponse = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}&type=owner`, {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'MCK-DevReport-Sync'
        }
      });

      if (reposResponse.ok) {
        const reposData = await reposResponse.json();
        if (Array.isArray(reposData) && reposData.length > 0) {
          // Prepare rows
          const rows = reposData.map((r: any) => ({
            account_id: accountId,
            repo_name: r.full_name,
            is_visible: true,
            language: r.language || 'None',
            updated_at: new Date().toISOString()
          }));

          // Upsert into monitored_repositories
          for (const row of rows) {
            await supabaseAdmin
              .from('monitored_repositories')
              .upsert([row], { onConflict: 'account_id,repo_name' });
          }

          if (reposData.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
        console.error(`Failed to fetch repos page ${page}:`, await reposResponse.text());
      }
    }

    return NextResponse.json({ success: true, message: `Akun GitHub @${username} berhasil dihubungkan!` });
  } catch (err: any) {
    console.error("POST connect account error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
