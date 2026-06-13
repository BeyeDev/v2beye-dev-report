-- Migration: 00002_add_indexes
-- Description: Add missing indexes for performance

CREATE INDEX IF NOT EXISTS idx_github_accounts_user_id ON github_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_monitored_repos_account_id ON monitored_repositories(account_id);
CREATE INDEX IF NOT EXISTS idx_work_reports_start_date ON work_reports(start_date);
CREATE INDEX IF NOT EXISTS idx_work_reports_end_date ON work_reports(end_date);
CREATE INDEX IF NOT EXISTS idx_pull_requests_repo_id ON pull_requests(repo_id);
