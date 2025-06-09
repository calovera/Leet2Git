// Leet2Git Content Script - Updated for Current LeetCode Interface
console.log("Leet2Git content script loaded on LeetCode");

class LeetCodeDetector {
  constructor() {
    this.observer = null;
    this.isObserving = false;
    this.lastSubmissionTime = 0;
    this.debugMode = true;
    this.init();
  }

  init() {
    this.log("Initializing LeetCode detector...");
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupDetection());
    } else {
      this.setupDetection();
    }
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[Leet2Git] ${message}`, data || '');
    }
  }

  setupDetection() {
    this.log("Setting up submission detection...");
    
    // Method 1: Watch for submission result modals
    this.setupMutationObserver();
    
    // Method 2: Intercept network requests (backup)
    this.setupNetworkInterception();
    
    // Method 3: Watch for URL changes (for SPA navigation)
    this.setupURLWatcher();
    
    this.log("Detection methods initialized");
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // Check for submission result
          this.checkForSubmissionResult();
          
          // Check for newly added elements that might contain results
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkElementForSubmissionResult(node);
            }
          });
        }
      });
    });
    
    this.startObserving();
  }

  startObserving() {
    if (this.observer && !this.isObserving) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-state', 'data-testid']
      });
      this.isObserving = true;
      this.log("Started DOM observation");
    }
  }

  setupNetworkInterception() {
    // Override fetch to catch submission responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (args[0] && typeof args[0] === 'string') {
        const url = args[0];
        if (url.includes('/submit/') || url.includes('/api/submissions/')) {
          this.log("Detected submission API call", url);
          // Wait a bit for DOM to update, then check for results
          setTimeout(() => this.checkForSubmissionResult(), 2000);
        }
      }
      
      return response;
    };
  }

  setupURLWatcher() {
    let currentURL = window.location.href;
    
    const checkURL = () => {
      if (window.location.href !== currentURL) {
        currentURL = window.location.href;
        this.log("URL changed", currentURL);
        
        // Re-setup detection after navigation
        setTimeout(() => this.setupDetection(), 1000);
      }
    };
    
    setInterval(checkURL, 1000);
  }

  checkForSubmissionResult() {
    // Throttle checks
    const now = Date.now();
    if (now - this.lastSubmissionTime < 1000) return;
    
    if (!this.isOnProblemPage()) return;
    
    // Updated selectors for current LeetCode interface (2024)
    const successSelectors = [
      // Primary selectors
      '[data-e2e-locator="submission-result"]',
      '[data-testid="submission-result"]',
      
      // Text-based selectors
      '.text-green-500',
      '.text-green-600', 
      '.text-green-dark',
      '[class*="text-green"]',
      
      // Status indicators
      '.submission-status',
      '[class*="submission-result"]',
      '[class*="result-"]',
      
      // Modal/dialog selectors  
      '[role="dialog"] [class*="green"]',
      '.modal [class*="success"]',
      
      // Generic success patterns
      '[class*="success"]',
      '[class*="accepted"]',
      '[class*="correct"]'
    ];

    let acceptedElement = null;
    
    for (const selector of successSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent?.toLowerCase() || '';
          if (text.includes('accepted') || text.includes('success')) {
            acceptedElement = element;
            this.log("Found accepted submission element", {
              selector,
              text: element.textContent?.trim(),
              element
            });
            break;
          }
        }
        if (acceptedElement) break;
      } catch (e) {
        // Continue checking other selectors
      }
    }

    if (acceptedElement) {
      this.lastSubmissionTime = now;
      this.handleAcceptedSubmission();
    }
  }

  checkElementForSubmissionResult(element) {
    const text = element.textContent?.toLowerCase() || '';
    if (text.includes('accepted') && text.includes('runtime')) {
      this.log("Found potential result element", element);
      this.handleAcceptedSubmission();
    }
  }

  isOnProblemPage() {
    return window.location.pathname.includes("/problems/") && 
           !window.location.pathname.includes("/submissions") &&
           !window.location.pathname.includes("/discuss");
  }

  async handleAcceptedSubmission() {
    this.log("Handling accepted submission...");
    
    try {
      // Wait for any animations/state updates to complete
      await new Promise(resolve => setTimeout(resolve, 1500));

      const solutionData = this.extractSolutionData();
      if (solutionData) {
        this.log("Extracted solution data", solutionData);
        
        chrome.runtime.sendMessage(
          { type: "solved_dom", payload: solutionData },
          (response) => {
            if (response?.success) {
              this.log("Solution sent to background successfully");
            } else {
              this.log("Failed to send solution", response?.error);
            }
          }
        );
      } else {
        this.log("Failed to extract solution data");
      }
    } catch (error) {
      this.log("Error handling submission", error);
    }
  }

  extractSolutionData() {
    try {
      // Updated title extraction for current LeetCode
      const title = this.extractTitle();
      if (!title) {
        this.log("Could not extract title");
        return null;
      }

      const slug = this.extractSlug();
      if (!slug) {
        this.log("Could not extract slug");
        return null;
      }

      const difficulty = this.extractDifficulty();
      const description = this.extractDescription();
      const code = this.extractCode();
      const language = this.extractLanguage();

      if (!code) {
        this.log("Could not extract code");
        return null;
      }

      const solution = {
        id: `${slug}-${language.toLowerCase()}-${Date.now()}`,
        title,
        slug,
        difficulty,
        description,
        code,
        language,
        timestamp: Date.now()
      };

      this.log("Successfully extracted solution", solution);
      return solution;

    } catch (error) {
      this.log("Error extracting solution data", error);
      return null;
    }
  }

  extractTitle() {
    // Updated selectors for current LeetCode interface
    const titleSelectors = [
      // Primary selectors
      '[data-cy="question-title"]',
      'h1[data-cy="question-title"]',
      
      // Class-based selectors
      'h1[class*="title"]',
      '.question-title',
      '[class*="question-title"]',
      
      // CSS selectors (may be dynamic)
      '.css-v3d350',
      'h1.text-title-large',
      'h1.text-lg',
      
      // Generic fallbacks
      'h1',
      '[data-track-load="question_title"]',
      '.content-title h1'
    ];

    for (const selector of titleSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text && 
              text.length > 0 && 
              !text.toLowerCase().includes('leetcode') && 
              !text.toLowerCase().includes('sign in') &&
              !text.toLowerCase().includes('premium')) {
            this.log("Found title", { selector, text });
            return text;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Fallback: extract from URL
    const pathMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    if (pathMatch) {
      const title = pathMatch[1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      this.log("Extracted title from URL", title);
      return title;
    }

    this.log("No title found with any selector");
    return null;
  }

  extractSlug() {
    const pathMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    return pathMatch?.[1] || null;
  }

  extractDifficulty() {
    const difficultySelectors = [
      '[data-difficulty]',
      '[class*="difficulty"]',
      '.css-dcmtd5',
      '[class*="text-difficulty"]',
      'span[class*="easy"]',
      'span[class*="medium"]', 
      'span[class*="hard"]'
    ];

    for (const selector of difficultySelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.toLowerCase() || '';
          if (text.includes('easy')) return 'Easy';
          if (text.includes('medium')) return 'Medium';
          if (text.includes('hard')) return 'Hard';
        }
      } catch (e) {
        // Continue
      }
    }

    return 'Medium'; // Default
  }

  extractDescription() {
    const descriptionSelectors = [
      '[data-track-load="description_content"]',
      '.css-1iinkds',
      '[class*="question-content"]',
      '.content__u3I1 .question-content',
      '[class*="problem-content"]',
      '.problem-statement'
    ];

    for (const selector of descriptionSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text && text.length > 50) {
            return text;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    return '';
  }

  extractCode() {
    // Try Monaco API first (most reliable)
    try {
      if (window.monaco?.editor) {
        const models = window.monaco.editor.getModels();
        if (models.length > 0) {
          const code = models[0].getValue();
          if (code?.trim()) {
            this.log("Extracted code via Monaco API");
            return code;
          }
        }
      }
    } catch (e) {
      this.log("Monaco API not available");
    }

    // Try DOM selectors
    const editorSelectors = [
      // Monaco editor
      '.monaco-editor .view-lines',
      '[class*="monaco"] .view-lines',
      
      // CodeMirror
      '.CodeMirror-code',
      '.CodeMirror .CodeMirror-line',
      
      // Textarea fallbacks
      'textarea[data-cy="code-editor"]',
      '#editor textarea',
      '.editor-container textarea',
      '[class*="editor"] textarea',
      'textarea[class*="code"]',
      
      // Other editor patterns
      '[data-mode-id] .view-lines',
      '.ace_content',
      '[class*="code-editor"]'
    ];

    for (const selector of editorSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          let code = '';
          
          if (element.classList.contains('view-lines')) {
            // Monaco editor DOM
            const lines = element.querySelectorAll('.view-line');
            code = Array.from(lines).map(line => line.textContent || "").join('\n');
          } else if (element.classList.contains('CodeMirror-code')) {
            // CodeMirror
            const lines = element.querySelectorAll('.CodeMirror-line');
            code = Array.from(lines).map(line => line.textContent || "").join('\n');
          } else if (element.tagName === 'TEXTAREA') {
            code = element.value;
          } else {
            code = element.textContent || "";
          }
          
          if (code?.trim()) {
            this.log("Extracted code via DOM", { selector, codeLength: code.length });
            return code;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    this.log("Could not extract code from any source");
    return null;
  }

  extractLanguage() {
    const languageSelectors = [
      '[data-cy="lang-select"] .ant-select-selection-item',
      '.lang-select .selected',
      '[class*="language-select"] [class*="selected"]',
      'button[data-state="selected"][role="option"]',
      '[class*="language"] [class*="selected"]',
      '.language-picker [class*="active"]'
    ];

    for (const selector of languageSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          const lang = element.textContent.trim();
          this.log("Found language", lang);
          return lang;
        }
      } catch (e) {
        // Continue
      }
    }

    // Fallback: detect from code
    const code = this.extractCode();
    if (code) {
      if (code.includes('def ') || code.includes('print(')) return 'Python';
      if (code.includes('function ') || code.includes('const ') || code.includes('let ')) return 'JavaScript';
      if (code.includes('class ') && code.includes('public static')) return 'Java';
      if (code.includes('#include') || code.includes('std::')) return 'C++';
    }

    return 'JavaScript'; // Default
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isObserving = false;
    this.log("Detector destroyed");
  }
}

// Initialize detector
const detector = new LeetCodeDetector();

// Handle page navigation
let currentHref = window.location.href;
const navigationObserver = new MutationObserver(() => {
  if (window.location.href !== currentHref) {
    currentHref = window.location.href;
    console.log("[Leet2Git] Page navigated, reinitializing detector");
    detector.destroy();
    setTimeout(() => {
      new LeetCodeDetector();
    }, 1000);
  }
});

navigationObserver.observe(document.body, { childList: true, subtree: true });

// Cleanup
window.addEventListener('beforeunload', () => {
  detector.destroy();
  navigationObserver.disconnect();
});

// Export for debugging
window.leetCodeDetector = detector;