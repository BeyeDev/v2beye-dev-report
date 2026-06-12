import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repo_id, is_visible } = await request.json();
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

    const { data: repo } = await supabaseAdmin
      .from('monitored_repositories')
      .select('*, github_accounts(user_id)')
      .eq('repo_id', repo_id)
      .single();

    if (!repo) {
      return NextResponse.json({ success: false, error: "Repository not found" }, { status: 404 });
    }

    if (repo.github_accounts?.user_id !== dbUser.user_id) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your repository" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('monitored_repositories')
      .update({ is_visible: is_visible, updated_at: new Date().toISOString() })
      .eq('repo_id', repo_id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Visibility updated successfully!" });
  } catch (err: any) {
    console.error("Toggle visibility error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
