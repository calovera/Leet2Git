// Content script for LeetCode - fallback MutationObserver
console.log('Leet2Git content script loaded on LeetCode');

interface LeetCodeSolution {
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  code: string;
  language: string;
}

class LeetCodeHook {
  private observer: MutationObserver | null = null;
  private isObserving = false;

  constructor() {
    this.init();
  }

  private init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupObserver());
    } else {
      this.setupObserver();
    }
  }

  private setupObserver() {
    // Set up mutation observer to watch for accepted submissions
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.checkForAcceptedModal();
        }
      });
    });

    // Start observing
    this.startObserving();
  }

  private startObserving() {
    if (this.observer && !this.isObserving) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-state']
      });
      this.isObserving = true;
      console.log('Started observing DOM for LeetCode submissions');
    }
  }

  private stopObserving() {
    if (this.observer && this.isObserving) {
      this.observer.disconnect();
      this.isObserving = false;
      console.log('Stopped observing DOM');
    }
  }

  private checkForAcceptedModal() {
    // Check for various accepted submission indicators
    const acceptedSelectors = [
      '[data-e2e-locator="submission-result"]',
      '.text-green-500',
      '[class*="text-green"]',
      '.submission-status',
      '[data-cy="submission-result"]'
    ];

    let acceptedElement = null;
    for (const selector of acceptedSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.textContent?.includes('Accepted')) {
            acceptedElement = element;
            break;
          }
        }
        if (acceptedElement) break;
      } catch (error) {
        // Continue with next selector
      }
    }

    // Alternative check for success modals/notifications
    if (!acceptedElement) {
      const successElements = document.querySelectorAll('[class*="success"], [class*="green"], .text-green-500, .text-success');
      for (const element of successElements) {
        if (element.textContent?.toLowerCase().includes('accepted') || 
            element.textContent?.toLowerCase().includes('success')) {
          acceptedElement = element;
          break;
        }
      }
    }

    if (acceptedElement && this.isOnProblemPage()) {
      console.log('Detected accepted submission');
      this.handleAcceptedSubmission();
    }
  }

  private isOnProblemPage(): boolean {
    return window.location.pathname.includes('/problems/') && 
           !window.location.pathname.includes('/submissions');
  }

  private async handleAcceptedSubmission() {
    try {
      // Add a small delay to ensure the page has updated
      await new Promise(resolve => setTimeout(resolve, 1000));

      const solution = this.extractSolutionData();
      if (solution) {
        // Send to background script
        chrome.runtime.sendMessage({
          type: 'solved_dom',
          payload: solution
        }, (response) => {
          if (response?.success) {
            console.log('Solution sent to background:', solution.title);
          } else {
            console.error('Failed to send solution:', response?.error);
          }
        });
      }
    } catch (error) {
      console.error('Error handling accepted submission:', error);
    }
  }

  private extractSolutionData(): LeetCodeSolution | null {
    try {
      // Extract problem title
      const titleElement = document.querySelector('[data-cy="question-title"]') || 
                          document.querySelector('h1[class*="title"]') ||
                          document.querySelector('.css-v3d350') ||
                          document.querySelector('h1');
      
      const title = titleElement?.textContent?.trim();
      if (!title) {
        console.error('Could not extract problem title');
        return null;
      }

      // Extract slug from URL
      const pathMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
      const slug = pathMatch?.[1];
      if (!slug) {
        console.error('Could not extract problem slug');
        return null;
      }

      // Extract difficulty
      const difficultyElement = document.querySelector('[diff]') ||
                               document.querySelector('[class*="difficulty"]') ||
                               document.querySelector('.css-dcmtd5');
      
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      if (difficultyElement) {
        const diffText = difficultyElement.textContent?.toLowerCase() || '';
        if (diffText.includes('easy')) difficulty = 'Easy';
        else if (diffText.includes('hard')) difficulty = 'Hard';
      }

      // Extract description
      const descriptionElement = document.querySelector('[data-track-load="description_content"]') ||
                                document.querySelector('.css-1iinkds') ||
                                document.querySelector('[class*="question-content"]');
      
      const description = descriptionElement?.textContent?.trim() || '';

      // Extract code from editor
      const code = this.extractCodeFromEditor();
      if (!code) {
        console.error('Could not extract code from editor');
        return null;
      }

      // Extract language
      const language = this.extractLanguage();

      return {
        title,
        slug,
        difficulty,
        description,
        code,
        language
      };
    } catch (error) {
      console.error('Error extracting solution data:', error);
      return null;
    }
  }

  private extractCodeFromEditor(): string {
    // Try multiple methods to get code
    const codeSelectors = [
      '.monaco-editor .view-lines',
      '.CodeMirror-code',
      '[data-mode-id] .view-lines',
      '.ace_content',
      'textarea[data-cy="code-editor"]'
    ];

    for (const selector of codeSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // For Monaco editor
        if (element.classList.contains('view-lines')) {
          const lines = element.querySelectorAll('.view-line');
          return Array.from(lines).map(line => line.textContent || '').join('\n');
        }
        
        // For CodeMirror
        if (element.classList.contains('CodeMirror-code')) {
          const lines = element.querySelectorAll('.CodeMirror-line');
          return Array.from(lines).map(line => line.textContent || '').join('\n');
        }
        
        // For textarea
        if (element.tagName === 'TEXTAREA') {
          return (element as HTMLTextAreaElement).value;
        }

        return element.textContent || '';
      }
    }

    // Try to access Monaco editor instance
    try {
      // @ts-ignore
      if (window.monaco && window.monaco.editor) {
        // @ts-ignore
        const models = window.monaco.editor.getModels();
        if (models.length > 0) {
          return models[0].getValue();
        }
      }
    } catch (error) {
      console.log('Could not access Monaco editor instance');
    }

    // Try to access from global objects
    try {
      // @ts-ignore
      if (window.editor && typeof window.editor.getValue === 'function') {
        // @ts-ignore
        return window.editor.getValue();
      }
    } catch (error) {
      console.log('Could not access global editor');
    }

    return '';
  }

  private extractLanguage(): string {
    // Try to find language selector
    const languageSelectors = [
      '[data-cy="lang-select"] .ant-select-selection-item',
      '.lang-select .selected',
      '[class*="language-select"] [class*="selected"]',
      'button[data-state="selected"][role="option"]'
    ];

    for (const selector of languageSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam) {
      return langParam;
    }

    // Fallback based on file extension or common patterns
    const code = this.extractCodeFromEditor();
    if (code.includes('def ') || code.includes('print(')) return 'Python';
    if (code.includes('function ') || code.includes('const ') || code.includes('let ')) return 'JavaScript';
    if (code.includes('class ') && code.includes('public static')) return 'Java';
    if (code.includes('#include') || code.includes('std::')) return 'C++';

    return 'JavaScript'; // Default fallback
  }

  public destroy() {
    this.stopObserving();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialize the hook
const leetCodeHook = new LeetCodeHook();

// Handle page navigation (SPA)
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('Page navigated, reinitializing hook');
    leetCodeHook.destroy();
    setTimeout(() => {
      new LeetCodeHook();
    }, 1000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  leetCodeHook.destroy();
  observer.disconnect();
});