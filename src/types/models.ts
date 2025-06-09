export interface SolutionPayload {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  code: string;
  language: string;
  timestamp: number;
  status: string;
  testCases?: Array<{ input: string; output: string }>;
  submissionId?: string;
  runtime?: string;
  memory?: string;
}

export interface Stats {
  streak: number;
  lastSolveDate: string;
  counts: {
    easy: number;
    medium: number;
    hard: number;
  };
  recentSolves: Array<{
    id: string;
    title: string;
    language: string;
    timestamp: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }>;
}

export interface PendingItem {
  id: string;
  title: string;
  slug: string;
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string;
  timestamp: number;
  description?: string;
  submissionId?: string;
}

export interface RepoCfg {
  owner: string;
  repo: string;
  branch: string;
  private: boolean;
  folderStructure: 'difficulty' | 'topic' | 'flat';
  includeDescription: boolean;
  includeTestCases: boolean;
}

export interface GitHubAuth {
  token: string;
  username: string;
  email: string;
  connected: boolean;
}

export interface HomeData {
  stats: Stats;
  pending: PendingItem[];
  auth: GitHubAuth | null;
  config: RepoCfg;
}

export interface ChromeMessage {
  type: 'auth' | 'push' | 'getHomeData' | 'solved_dom' | 'updateConfig';
  payload?: any;
}