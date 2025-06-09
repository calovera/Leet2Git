import { ConnectionStatus, LeetCodeSubmission } from '../types';

export async function checkLeetCodeConnection(): Promise<ConnectionStatus['leetcode']> {
  try {
    // Send message to content script to check login status
    const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
    
    if (tabs.length === 0) {
      return { connected: false, username: null };
    }

    const response = await chrome.tabs.sendMessage(tabs[0].id!, {
      type: 'CHECK_LOGIN_STATUS'
    });

    return {
      connected: response.connected || false,
      username: response.username || null
    };
  } catch (error) {
    console.error('Failed to check LeetCode connection:', error);
    return { connected: false, username: null };
  }
}

export async function getRecentSubmissions(): Promise<LeetCodeSubmission[]> {
  try {
    // Find LeetCode tabs
    const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
    
    if (tabs.length === 0) {
      throw new Error('No LeetCode tab found. Please open LeetCode in a tab.');
    }

    // Send message to content script to get submissions
    const response = await chrome.tabs.sendMessage(tabs[0].id!, {
      type: 'GET_SUBMISSIONS'
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response || [];
  } catch (error) {
    console.error('Failed to get recent submissions:', error);
    throw error;
  }
}

export async function getCurrentProblem(): Promise<LeetCodeSubmission | null> {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/problems/*' });
    
    if (tabs.length === 0) {
      return null;
    }

    const response = await chrome.tabs.sendMessage(tabs[0].id!, {
      type: 'GET_CURRENT_PROBLEM'
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response;
  } catch (error) {
    console.error('Failed to get current problem:', error);
    return null;
  }
}

export function navigateToLeetCode(): void {
  chrome.tabs.create({ url: 'https://leetcode.com' });
}

export function navigateToSubmissions(): void {
  chrome.tabs.create({ url: 'https://leetcode.com/submissions/' });
}
