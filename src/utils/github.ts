import { RepoCfg, PendingItem } from '../types/models';

interface GitHubFileRequest {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
  content: string;
  message?: string;
}

interface GitHubFileResponse {
  sha?: string;
  content?: {
    sha: string;
  };
}

export async function upsertFile({
  token,
  owner,
  repo,
  branch,
  path,
  content,
  message = `Add solution: ${path}`
}: GitHubFileRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    // First, try to get the existing file to get its SHA
    let existingSha: string | undefined;
    try {
      const getResponse = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Leet2Git-Extension'
        }
      });
      
      if (getResponse.ok) {
        const existingFile: GitHubFileResponse = await getResponse.json();
        existingSha = existingFile.sha;
      }
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    // Prepare the request body
    const requestBody: any = {
      message,
      content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
      branch
    };
    
    if (existingSha) {
      requestBody.sha = existingSha;
    }
    
    // Create or update the file
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Leet2Git-Extension'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to upsert file to GitHub:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function createRepository(
  token: string,
  name: string,
  isPrivate: boolean = false,
  description: string = 'Automated LeetCode solutions sync via Leet2Git extension'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Leet2Git-Extension'
      },
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create repository: ${response.status} - ${errorData.message || response.statusText}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to create repository:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export function generateFilePath(item: PendingItem, config: RepoCfg): string {
  const extension = getFileExtension(item.language);
  const fileName = `${item.slug}.${extension}`;
  
  switch (config.folderStructure) {
    case 'difficulty':
      return `${item.difficulty.toLowerCase()}/${fileName}`;
    case 'topic':
      // For now, use difficulty as fallback for topic
      return `${item.difficulty.toLowerCase()}/${fileName}`;
    case 'flat':
    default:
      return fileName;
  }
}

export function generateFileContent(item: PendingItem, config: RepoCfg): string {
  const { title, difficulty, language, code, description } = item;
  
  let content = '';
  
  // Add header comment
  content += `/*\n`;
  content += `Problem: ${title}\n`;
  content += `Difficulty: ${difficulty}\n`;
  content += `Language: ${language}\n`;
  content += `URL: https://leetcode.com/problems/${item.slug}/\n`;
  content += `Date: ${new Date(item.timestamp).toISOString().split('T')[0]}\n`;
  content += `\n`;
  
  if (config.includeDescription && description) {
    content += `Description:\n`;
    content += description.split('\n').map(line => ` * ${line}`).join('\n');
    content += `\n`;
  }
  
  content += ` */\n\n`;
  
  // Add the solution code
  content += code;
  
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
    'Swift': 'swift',
    'Kotlin': 'kt',
    'Scala': 'scala',
    'Ruby': 'rb',
    'PHP': 'php'
  };
  
  return extensions[language] || 'txt';
}

export async function verifyToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Leet2Git-Extension'
      }
    });
    
    if (!response.ok) {
      return { valid: false, error: 'Invalid token' };
    }
    
    const user = await response.json();
    return { valid: true, username: user.login };
  } catch (error) {
    return { valid: false, error: 'Failed to verify token' };
  }
}