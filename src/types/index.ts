export interface ConnectionStatus {
  github: {
    connected: boolean;
    username: string | null;
  };
  leetcode: {
    connected: boolean;
    username: string | null;
  };
}

export interface SyncStatus {
  isRunning: boolean;
  progress: number;
  currentTask: string;
  lastSync: Date | null;
}

export interface Settings {
  autoSync: boolean;
  privateRepo: boolean;
  includeTests: boolean;
}

export interface ActivityItem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

export interface LeetCodeSubmission {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  code: string;
  language: string;
  testCases?: Array<{ input: string; output: string }>;
  timestamp: Date;
  status: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
}

export interface StorageData {
  github_token?: string;
  github_user?: {
    username: string;
    email: string;
    connected: boolean;
  };
  leetcode_user?: {
    username: string;
    connected: boolean;
  };
  settings?: Settings;
  recentActivity?: ActivityItem[];
}
