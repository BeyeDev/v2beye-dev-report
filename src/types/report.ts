export interface CommitItem {
  sha: string;
  msg: string;
  repo: string;
  additions: number;
  deletions: number;
}

export interface PRItem {
  number: number;
  title: string;
  repo: string;
  state: "merged" | "open" | "closed" | string;
}

export interface EpicItem {
  name: string;
  owner: string;
  language: string;
  progress: number;
  status: string;
  difficulty: number;
}

export interface TaskItem {
  id: string;
  title: string;
  repoName: string;
  type: string;
  difficulty: number;
  state: string;
}

export interface DevReportItem {
  report_id: string;
  developer: string;
  notes: string;
  blockers: string;
  submittedAt: string;
}
