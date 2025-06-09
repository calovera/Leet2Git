// Leet2Git Content Script - Backup DOM Capture Only
console.log("Leet2Git content script loaded - DOM fallback mode");

class LeetCodeFallbackDetector {
  constructor() {
    this.observer = null;
    this.isObserving = false;
    this.lastDOMCapture = 0;
    this.init();
  }

  init() {
    console.log("[Leet2Git] Initializing DOM fallback detector...");
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupObserver());
    } else {
      this.setupObserver();
    }
  }

  setupObserver() {
    // Only activate if 5+ seconds have passed since last network capture
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          this.checkForAcceptedSubmission();
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
        attributeFilter: ['class', 'data-state']
      });
      this.isObserving = true;
      console.log("[Leet2Git] DOM fallback observer started");
    }
  }

  checkForAcceptedSubmission() {
    // Only proceed if enough time has passed since last attempt
    const now = Date.now();
    if (now - this.lastDOMCapture < 5000) return; // 5 second throttle

    if (!this.isOnProblemPage()) return;

    // Look for accepted submission indicators
    const acceptedSelectors = [
      '[data-e2e-locator="submission-result"]',
      '.text-green-500',
      '[class*="text-green"]',
      '.submission-status',
      '[class*="accepted"]',
      '[class*="success"]'
    ];

    let acceptedElement = null;
    for (const selector of acceptedSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent?.toLowerCase() || '';
          if (text.includes('accepted') || text.includes('success')) {
            acceptedElement = element;
            break;
          }
        }
        if (acceptedElement) break;
      } catch (e) {
        // Continue checking
      }
    }

    if (acceptedElement) {
      this.lastDOMCapture = now;
      setTimeout(() => this.handleAcceptedSubmission(), 1500);
    }
  }

  isOnProblemPage() {
    return window.location.pathname.includes("/problems/") && 
           !window.location.pathname.includes("/submissions");
  }

  async handleAcceptedSubmission() {
    console.log("[Leet2Git] DOM fallback - handling accepted submission");
    
    try {
      const solutionData = this.extractSolutionData();
      if (solutionData) {
        chrome.runtime.sendMessage(
          { type: "solved_dom", payload: solutionData },
          (response) => {
            if (response?.success) {
              console.log("[Leet2Git] DOM fallback successful");
            } else {
              console.log("[Leet2Git] DOM fallback rejected:", response?.reason);
            }
          }
        );
      }
    } catch (error) {
      console.error("[Leet2Git] DOM fallback error:", error);
    }
  }

  extractSolutionData() {
    try {
      const title = this.extractTitle();
      const slug = this.extractSlug();
      const code = this.extractCode();
      
      if (!title || !slug || !code) {
        console.log("[Leet2Git] DOM extraction incomplete", { title, slug, codeLength: code?.length });
        return null;
      }

      return {
        title,
        slug,
        difficulty: this.extractDifficulty(),
        code,
        language: this.extractLanguage(),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error("[Leet2Git] DOM extraction error:", error);
      return null;
    }
  }

  extractTitle() {
    const selectors = [
      '[data-cy="question-title"]',
      'h1[data-cy="question-title"]',
      'h1[class*="title"]',
      '.css-v3d350',
      'h1'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text && !text.includes('LeetCode') && !text.includes('Sign in')) {
            return text;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    // Fallback to URL
    const pathMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    if (pathMatch) {
      return pathMatch[1].split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }

    return null;
  }

  extractSlug() {
    const pathMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    return pathMatch?.[1] || null;
  }

  extractDifficulty() {
    const selectors = [
      '[data-difficulty]',
      '[class*="difficulty"]',
      '.css-dcmtd5'
    ];

    for (const selector of selectors) {
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

    return 'Medium';
  }

  extractCode() {
    // Try Monaco API first
    try {
      if (window.monaco?.editor) {
        const models = window.monaco.editor.getModels();
        if (models.length > 0) {
          const code = models[0].getValue();
          if (code?.trim()) return code;
        }
      }
    } catch (e) {
      // Continue
    }

    // Try DOM selectors
    const selectors = [
      '.monaco-editor .view-lines',
      '.CodeMirror-code',
      'textarea[data-cy="code-editor"]'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          if (element.classList.contains('view-lines')) {
            const lines = element.querySelectorAll('.view-line');
            const code = Array.from(lines).map(line => line.textContent || "").join('\n');
            if (code.trim()) return code;
          } else if (element.tagName === 'TEXTAREA') {
            if (element.value?.trim()) return element.value;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    return null;
  }

  extractLanguage() {
    const selectors = [
      '[data-cy="lang-select"] .ant-select-selection-item',
      '.lang-select .selected'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          return element.textContent.trim();
        }
      } catch (e) {
        // Continue
      }
    }

    return 'JavaScript';
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isObserving = false;
  }
}

// Initialize detector
const detector = new LeetCodeFallbackDetector();

// Handle page navigation
let currentHref = window.location.href;
const navigationObserver = new MutationObserver(() => {
  if (window.location.href !== currentHref) {
    currentHref = window.location.href;
    detector.destroy();
    setTimeout(() => {
      new LeetCodeFallbackDetector();
    }, 1000);
  }
});

navigationObserver.observe(document.body, { childList: true, subtree: true });

window.addEventListener('beforeunload', () => {
  detector.destroy();
  navigationObserver.disconnect();
});