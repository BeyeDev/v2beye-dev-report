export interface CommitItem {
  sha: string;
  msg: string;
  repo: string;
  additions: number;
  deletions: number;
  date?: string;
  author?: string;
}

export interface PRItem {
  number: number;
  title: string;
  repo: string;
  state: "merged" | "open" | "closed";
}

export interface EpicItem {
  name: string;
  owner: string;
  language: string;
  progress: number;
  status: string;
  difficulty: number;
  commits?: CommitItem[];
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
  commits?: CommitItem[];
  prs?: PRItem[];
}
