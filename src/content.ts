// Content script for LeetCode integration

interface LeetCodeSubmission {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  code: string;
  language: string;
  testCases?: Array<{ input: string; output: string }>;
  timestamp: Date;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | string;
}

class LeetCodeIntegration {
  private isLoggedIn: boolean = false;
  private username: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    this.checkLoginStatus();
    this.setupMessageListener();
    this.observeSubmissions();
  }

  private checkLoginStatus() {
    // Check if user is logged in by looking for user avatar or username
    const userAvatar = document.querySelector('[data-cy="user-avatar"]');
    const userMenu = document.querySelector('.nav-user-menu');
    
    if (userAvatar || userMenu) {
      this.isLoggedIn = true;
      
      // Try to extract username
      const usernameElement = document.querySelector('[data-cy="username"]') ||
                            document.querySelector('.nav-user-link') ||
                            document.querySelector('.username');
      
      if (usernameElement) {
        this.username = usernameElement.textContent?.trim() || null;
      }
    }
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'CHECK_LOGIN_STATUS':
          this.checkLoginStatus();
          sendResponse({
            connected: this.isLoggedIn,
            username: this.username
          });
          break;

        case 'GET_SUBMISSIONS':
          this.getRecentSubmissions().then(submissions => {
            sendResponse(submissions);
          }).catch(error => {
            sendResponse({ error: error.message });
          });
          return true; // Keep message channel open

        case 'GET_CURRENT_PROBLEM':
          this.getCurrentProblem().then(problem => {
            sendResponse(problem);
          }).catch(error => {
            sendResponse({ error: error.message });
          });
          return true;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    });
  }

  private observeSubmissions() {
    // Watch for successful submissions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Look for success notification
          const successElements = document.querySelectorAll('[data-cy="submission-success"]');
          if (successElements.length > 0) {
            this.handleSuccessfulSubmission();
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private async handleSuccessfulSubmission() {
    try {
      // Wait a bit for the submission to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const submission = await this.getCurrentProblem();
      if (submission) {
        // Notify background script about new submission
        chrome.runtime.sendMessage({
          type: 'NEW_SUBMISSION',
          submission
        });

        // Check if auto-sync is enabled
        const settings = await chrome.storage.local.get(['settings']);
        if (settings.settings?.autoSync) {
          chrome.runtime.sendMessage({
            type: 'SYNC_SOLUTIONS'
          });
        }
      }
    } catch (error) {
      console.error('Failed to handle submission:', error);
    }
  }

  private async getRecentSubmissions(): Promise<LeetCodeSubmission[]> {
    try {
      // Try to get submissions from the submissions page
      if (!window.location.href.includes('/submissions/')) {
        // Navigate to submissions page or use API if available
        return [];
      }

      const submissions: LeetCodeSubmission[] = [];
      const submissionRows = document.querySelectorAll('.submission-row, [data-cy="submission-item"]');

      for (const row of Array.from(submissionRows).slice(0, 10)) {
        try {
          const titleElement = row.querySelector('.problem-title, .title-link, a[href*="/problems/"]');
          const statusElement = row.querySelector('.status, .submission-status');
          const languageElement = row.querySelector('.language, .submission-language');
          const timeElement = row.querySelector('.timestamp, .submission-time');

          if (titleElement && statusElement) {
            const title = titleElement.textContent?.trim() || '';
            const status = statusElement.textContent?.trim() || '';
            const language = languageElement?.textContent?.trim() || 'Unknown';
            
            if (status === 'Accepted') {
              // Get the submission details
              const submissionLink = titleElement.getAttribute('href') || 
                                  row.querySelector('a')?.getAttribute('href');
              
              if (submissionLink) {
                const submissionDetails = await this.getSubmissionDetails(submissionLink);
                if (submissionDetails) {
                  submissions.push(submissionDetails);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing submission row:', error);
        }
      }

      return submissions;
    } catch (error) {
      console.error('Failed to get recent submissions:', error);
      return [];
    }
  }

  private async getCurrentProblem(): Promise<LeetCodeSubmission | null> {
    try {
      // Get problem title
      const titleElement = document.querySelector('[data-cy="question-title"]') ||
                         document.querySelector('.question-title') ||
                         document.querySelector('h1');
      
      if (!titleElement) return null;

      const title = titleElement.textContent?.trim() || '';

      // Get difficulty
      const difficultyElement = document.querySelector('[data-difficulty]') ||
                              document.querySelector('.difficulty') ||
                              document.querySelector('[class*="difficulty"]');
      
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      if (difficultyElement) {
        const diffText = difficultyElement.textContent?.toLowerCase() || '';
        if (diffText.includes('easy')) difficulty = 'Easy';
        else if (diffText.includes('hard')) difficulty = 'Hard';
      }

      // Get problem description
      const descriptionElement = document.querySelector('[data-cy="question-content"]') ||
                               document.querySelector('.question-content') ||
                               document.querySelector('.problem-description');
      
      const description = descriptionElement?.textContent?.trim() || '';

      // Get code from editor
      const codeEditor = document.querySelector('.monaco-editor') ||
                        document.querySelector('.CodeMirror') ||
                        document.querySelector('textarea[data-cy="code-editor"]');
      
      let code = '';
      if (codeEditor) {
        // Try to get code from Monaco editor
        const monacoTextArea = codeEditor.querySelector('textarea');
        if (monacoTextArea) {
          code = monacoTextArea.value;
        } else {
          // Try CodeMirror
          const codeMirror = (codeEditor as any).CodeMirror;
          if (codeMirror) {
            code = codeMirror.getValue();
          }
        }
      }

      // Get language
      const languageSelect = document.querySelector('[data-cy="lang-select"]') ||
                           document.querySelector('.language-select') ||
                           document.querySelector('select[name*="language"]');
      
      let language = 'JavaScript';
      if (languageSelect) {
        const selectedOption = languageSelect.querySelector('option:checked') ||
                             languageSelect.querySelector('.selected');
        if (selectedOption) {
          language = selectedOption.textContent?.trim() || 'JavaScript';
        }
      }

      // Get test cases
      const testCases = this.extractTestCases();

      return {
        title,
        difficulty,
        description,
        code,
        language,
        testCases,
        timestamp: new Date(),
        status: 'Accepted'
      };
    } catch (error) {
      console.error('Failed to get current problem:', error);
      return null;
    }
  }

  private async getSubmissionDetails(submissionUrl: string): Promise<LeetCodeSubmission | null> {
    try {
      // This would require making a request to the submission page
      // For now, return null as we need to avoid CORS issues
      return null;
    } catch (error) {
      console.error('Failed to get submission details:', error);
      return null;
    }
  }

  private extractTestCases(): Array<{ input: string; output: string }> {
    const testCases: Array<{ input: string; output: string }> = [];
    
    try {
      const testCaseElements = document.querySelectorAll('[data-cy="testcase"]') ||
                              document.querySelectorAll('.testcase') ||
                              document.querySelectorAll('.example');

      for (const element of testCaseElements) {
        const inputElement = element.querySelector('.input, [data-cy="input"]');
        const outputElement = element.querySelector('.output, [data-cy="output"]');

        if (inputElement && outputElement) {
          testCases.push({
            input: inputElement.textContent?.trim() || '',
            output: outputElement.textContent?.trim() || ''
          });
        }
      }
    } catch (error) {
      console.error('Failed to extract test cases:', error);
    }

    return testCases;
  }
}

// Initialize the LeetCode integration
new LeetCodeIntegration();
