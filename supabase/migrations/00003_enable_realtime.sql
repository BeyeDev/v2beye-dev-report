-- Migration: 00003_enable_realtime
-- Description: Aktifkan Supabase Realtime (Replication) untuk tabel yang dibutuhkan dashboard
-- Tabel: commits, pull_requests, issues, work_reports
-- Ini diperlukan agar subscription postgres_changes di client bisa menerima event

ALTER PUBLICATION supabase_realtime ADD TABLE commits;
ALTER PUBLICATION supabase_realtime ADD TABLE pull_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE work_reports;
