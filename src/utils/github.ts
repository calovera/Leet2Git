import { getStorageData } from './storage';
import { ConnectionStatus, Settings, LeetCodeSubmission } from '../types';

export async function checkGitHubConnection(): Promise<ConnectionStatus['github']> {
  try {
    const token = await getStorageData('github_token');
    const user = await getStorageData('github_user');
    
    if (!token || !user) {
      return { connected: false, username: null };
    }

    // Verify token is still valid
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
      },
    });

    if (response.ok) {
      return { connected: true, username: user.username };
    } else {
      return { connected: false, username: null };
    }
  } catch (error) {
    console.error('Failed to check GitHub connection:', error);
    return { connected: false, username: null };
  }
}

export async function syncToGitHub(submission: LeetCodeSubmission, settings: Settings): Promise<void> {
  const token = await getStorageData('github_token');
  const user = await getStorageData('github_user');
  
  if (!token || !user) {
    throw new Error('GitHub not connected');
  }

  const repoName = 'leetcode-solutions';
  const username = user.username;
  
  // Create file path
  const sanitizedTitle = submission.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
  const extension = getFileExtension(submission.language);
  const filePath = `${submission.difficulty}/${sanitizedTitle}.${extension}`;

  // Check if repository exists
  const repoResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
    headers: {
      'Authorization': `token ${token}`,
    },
  });

  if (repoResponse.status === 404) {
    // Create repository
    await createRepository(token, repoName, settings.privateRepo);
  }

  // Generate file content
  const fileContent = generateFileContent(submission, settings);
  const encodedContent = btoa(unescape(encodeURIComponent(fileContent)));

  // Check if file already exists
  const fileResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
    headers: {
      'Authorization': `token ${token}`,
    },
  });

  const body: any = {
    message: `Add solution: ${submission.title} (${submission.difficulty})`,
    content: encodedContent,
  };

  // If file exists, get its SHA for updating
  if (fileResponse.ok) {
    const fileData = await fileResponse.json();
    body.sha = fileData.sha;
    body.message = `Update solution: ${submission.title} (${submission.difficulty})`;
  }

  // Create or update the file
  const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to sync to GitHub: ${errorData.message || response.statusText}`);
  }
}

async function createRepository(token: string, repoName: string, isPrivate: boolean): Promise<void> {
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      description: 'LeetCode solutions automatically synced via Leet2Git Chrome extension',
      private: isPrivate,
      auto_init: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create repository: ${errorData.message || response.statusText}`);
  }
}

function generateFileContent(submission: LeetCodeSubmission, settings: Settings): string {
  let content = '';
  
  // Add header comment
  content += `/*\n`;
  content += ` * Problem: ${submission.title}\n`;
  content += ` * Difficulty: ${submission.difficulty}\n`;
  content += ` * Language: ${submission.language}\n`;
  content += ` * Solved on: ${submission.timestamp.toISOString().split('T')[0]}\n`;
  content += ` * \n`;
  
  // Add problem description if available
  if (submission.description) {
    const description = submission.description.substring(0, 500);
    content += ` * Description:\n`;
    content += ` * ${description}${description.length >= 500 ? '...' : ''}\n`;
    content += ` * \n`;
  }
  
  content += ` */\n\n`;
  
  // Add the solution code
  content += submission.code;
  
  // Add test cases if enabled and available
  if (settings.includeTests && submission.testCases && submission.testCases.length > 0) {
    content += '\n\n/*\n * Test Cases:\n';
    submission.testCases.forEach((testCase, index) => {
      content += ` * ${index + 1}. Input: ${testCase.input}\n`;
      content += ` *    Expected Output: ${testCase.output}\n`;
    });
    content += ' */';
  }
  
  return content;
}

function getFileExtension(language: string): string {
  const extensions: { [key: string]: string } = {
    'JavaScript': 'js',
    'TypeScript': 'ts',
    'Python': 'py',
    'Python3': 'py',
    'Java': 'java',
    'C++': 'cpp',
    'C': 'c',
    'C#': 'cs',
    'Go': 'go',
    'Rust': 'rs',
    'Ruby': 'rb',
    'Swift': 'swift',
    'Kotlin': 'kt',
    'Scala': 'scala',
    'PHP': 'php',
  };
  
  return extensions[language] || 'txt';
}
