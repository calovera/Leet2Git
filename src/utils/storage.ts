import { Stats, PendingItem, GitHubAuth, RepoCfg } from '../types/models';

export async function get<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.sync.get([key]);
    return result[key] || null;
  } catch (error) {
    console.error(`Failed to get ${key} from storage:`, error);
    return null;
  }
}

export async function set<T>(key: string, value: T): Promise<boolean> {
  try {
    await chrome.storage.sync.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`Failed to set ${key} in storage:`, error);
    return false;
  }
}

export async function remove(key: string): Promise<boolean> {
  try {
    await chrome.storage.sync.remove([key]);
    return true;
  } catch (error) {
    console.error(`Failed to remove ${key} from storage:`, error);
    return false;
  }
}

export async function getStats(): Promise<Stats> {
  const stats = await get<Stats>('stats');
  return stats || {
    streak: 0,
    lastSolveDate: '',
    counts: { easy: 0, medium: 0, hard: 0 },
    recentSolves: []
  };
}

export async function updateStats(newSolve: { 
  id: string; 
  title: string; 
  language: string; 
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timestamp: number;
}): Promise<void> {
  const stats = await getStats();
  const today = new Date().toDateString();
  const lastSolve = stats.lastSolveDate ? new Date(stats.lastSolveDate).toDateString() : '';
  
  // Update streak
  if (lastSolve === today) {
    // Same day, no streak change
  } else if (lastSolve === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()) {
    // Yesterday, increment streak
    stats.streak += 1;
  } else if (lastSolve === '') {
    // First solve
    stats.streak = 1;
  } else {
    // Gap in solving, reset streak
    stats.streak = 1;
  }
  
  stats.lastSolveDate = new Date().toISOString();
  
  // Update counts
  stats.counts[newSolve.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'] += 1;
  
  // Update recent solves
  stats.recentSolves = [newSolve, ...stats.recentSolves.slice(0, 9)];
  
  await set('stats', stats);
}

export async function getPending(): Promise<PendingItem[]> {
  const pending = await get<PendingItem[]>('pending');
  return pending || [];
}

export async function addPending(item: PendingItem): Promise<void> {
  const pending = await getPending();
  
  // Check if already exists (same slug + language)
  const exists = pending.some(p => p.slug === item.slug && p.language === item.language);
  if (exists) {
    console.log('Solution already pending:', item.slug, item.language);
    return;
  }
  
  pending.push(item);
  await set('pending', pending);
}

export async function removePending(id: string): Promise<void> {
  const pending = await getPending();
  const filtered = pending.filter(item => item.id !== id);
  await set('pending', filtered);
}

export async function clearPending(): Promise<void> {
  await set('pending', []);
}

export async function getAuth(): Promise<GitHubAuth | null> {
  return await get<GitHubAuth>('github_auth');
}

export async function setAuth(auth: GitHubAuth): Promise<void> {
  await set('github_auth', auth);
}

export async function getConfig(): Promise<RepoCfg> {
  const config = await get<RepoCfg>('repo_config');
  return config || {
    owner: '',
    repo: 'leetcode-solutions',
    branch: 'main',
    private: false,
    folderStructure: 'difficulty',
    includeDescription: true,
    includeTestCases: true
  };
}

export async function setConfig(config: RepoCfg): Promise<void> {
  await set('repo_config', config);
}