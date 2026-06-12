-- Migration: 00001_devreport_schema
-- Description: Schema database untuk Mili Cipta Karya DevReport

-- 1. Tabel Master User (Developer, Manajemen, Admin)
CREATE TABLE IF NOT EXISTS master_user (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- Terhubung dengan auth.users milik Supabase Auth
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Developer', 'Manajemen', 'Admin')),
  status_aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Akun GitHub (Mendukung multi-akun per developer)
CREATE TABLE IF NOT EXISTS github_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES master_user(user_id) ON DELETE CASCADE,
  github_username VARCHAR(255) NOT NULL UNIQUE,
  github_avatar_url TEXT,
  encrypted_access_token TEXT, -- Token GitHub terenkripsi (AES-256)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Repositori Terpantau (Developer menentukan repo mana saja yang visibel)
CREATE TABLE IF NOT EXISTS monitored_repositories (
  repo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES github_accounts(account_id) ON DELETE CASCADE,
  repo_name VARCHAR(255) NOT NULL, -- Format: owner/name
  is_visible BOOLEAN DEFAULT TRUE,
  language VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, repo_name)
);

-- 4. Tabel Commits
CREATE TABLE IF NOT EXISTS commits (
  commit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES monitored_repositories(repo_id) ON DELETE CASCADE,
  sha VARCHAR(100) NOT NULL UNIQUE,
  message TEXT NOT NULL,
  author_username VARCHAR(255) NOT NULL,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  commit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  branch_name VARCHAR(255) DEFAULT 'main',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Pull Requests
CREATE TABLE IF NOT EXISTS pull_requests (
  pr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES monitored_repositories(repo_id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('open', 'merged', 'closed')),
  creator_username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  merged_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  lead_time_hours NUMERIC(10,2), -- Waktu dari dibuka hingga merged/closed
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(repo_id, number)
);

-- 6. Tabel Issues / Tasks
CREATE TABLE IF NOT EXISTS issues (
  issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES monitored_repositories(repo_id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('open', 'closed')),
  assignee_username VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(repo_id, number)
);

-- 7. Tabel Laporan Kerja Harian / Mingguan / Bulanan
CREATE TABLE IF NOT EXISTS work_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES master_user(user_id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_summary JSONB NOT NULL, -- Ringkasan jumlah commits, PRs, dan files
  manual_notes TEXT, -- Catatan manual dari developer (meeting, riset, blocker, dll.)
  is_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabel Audit Log Akses Manajemen
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES master_user(user_id) ON DELETE SET NULL, -- Manajemen / Admin yang mengakses
  action_type VARCHAR(100) NOT NULL, -- Misal: 'VIEW_REPORT', 'EXPORT_PDF', 'EDIT_USER'
  target_user_id UUID REFERENCES master_user(user_id) ON DELETE SET NULL, -- Developer yang datanya diakses
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk optimasi query timeline & pencarian
CREATE INDEX IF NOT EXISTS idx_commits_date ON commits(commit_date DESC);
CREATE INDEX IF NOT EXISTS idx_commits_repo ON commits(repo_id);
CREATE INDEX IF NOT EXISTS idx_pr_repo_state ON pull_requests(repo_id, state);
CREATE INDEX IF NOT EXISTS idx_issues_assignee ON issues(assignee_username);
CREATE INDEX IF NOT EXISTS idx_reports_user_type ON work_reports(user_id, type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at DESC);

-- =========================================================
-- Konfigurasi RLS (Row Level Security) untuk Proteksi Data
-- =========================================================

ALTER TABLE master_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Master User
-- Admin mendapat akses penuh ke master_user
CREATE POLICY "Admin full access to master_user" ON master_user 
  FOR ALL TO authenticated USING (
    (SELECT role FROM master_user WHERE auth_user_id = auth.uid()) = 'Admin'
  );

-- Pengguna terautentikasi dapat membaca data dirinya sendiri
CREATE POLICY "User can read own profile" ON master_user
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- Policy 2: GitHub Accounts
-- Developer dapat melihat dan mengelola akun GitHub mereka sendiri
CREATE POLICY "Developer can manage own github accounts" ON github_accounts
  FOR ALL TO authenticated USING (
    user_id = (SELECT user_id FROM master_user WHERE auth_user_id = auth.uid())
  );

-- Policy 3: Monitored Repositories
CREATE POLICY "Developer can manage own repositories" ON monitored_repositories
  FOR ALL TO authenticated USING (
    account_id IN (
      SELECT account_id FROM github_accounts 
      WHERE user_id = (SELECT user_id FROM master_user WHERE auth_user_id = auth.uid())
    )
  );

-- Policy 4: Commits, PRs, & Issues
-- Developer dapat melihat commits dari repo mereka sendiri
CREATE POLICY "Developer can read commits of own repos" ON commits
  FOR SELECT TO authenticated USING (
    repo_id IN (
      SELECT repo_id FROM monitored_repositories
      WHERE account_id IN (
        SELECT account_id FROM github_accounts 
        WHERE user_id = (SELECT user_id FROM master_user WHERE auth_user_id = auth.uid())
      )
    )
  );

-- Manajemen dan Admin dapat melihat commits dari repo yang terlihat (is_visible = true)
CREATE POLICY "Management can read visible commits" ON commits
  FOR SELECT TO authenticated USING (
    (SELECT role FROM master_user WHERE auth_user_id = auth.uid()) IN ('Manajemen', 'Admin')
    AND repo_id IN (SELECT repo_id FROM monitored_repositories WHERE is_visible = true)
  );

-- Policy 5: Work Reports
-- Developer dapat mengelola laporan miliknya sendiri
CREATE POLICY "Developer can manage own reports" ON work_reports
  FOR ALL TO authenticated USING (
    user_id = (SELECT user_id FROM master_user WHERE auth_user_id = auth.uid())
  );

-- Manajemen dapat melihat laporan yang sudah diserahkan (is_submitted = true)
CREATE POLICY "Management can view submitted reports" ON work_reports
  FOR SELECT TO authenticated USING (
    (SELECT role FROM master_user WHERE auth_user_id = auth.uid()) IN ('Manajemen', 'Admin')
    AND is_submitted = true
  );

-- Policy 6: Audit Logs
-- Hanya Admin yang dapat melihat audit logs
CREATE POLICY "Admin can read audit logs" ON admin_audit_logs
  FOR SELECT TO authenticated USING (
    (SELECT role FROM master_user WHERE auth_user_id = auth.uid()) = 'Admin'
  );
