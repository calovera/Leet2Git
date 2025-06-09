// Leet2Git Content Script for LeetCode
console.log("Leet2Git content script loaded on LeetCode");

class LeetCodeDetector {
  constructor() {
    this.observer = null;
    this.isObserving = false;
    this.lastSubmissionTime = 0;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupObserver());
    } else {
      this.setupObserver();
    }
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          this.checkForAcceptedModal();
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
      console.log("Started observing DOM for LeetCode submissions");
    }
  }

  stopObserving() {
    if (this.observer && this.isObserving) {
      this.observer.disconnect();
      this.isObserving = false;
      console.log("Stopped observing DOM");
    }
  }

  checkForAcceptedModal() {
    // Throttle checks to prevent spam
    const now = Date.now();
    if (now - this.lastSubmissionTime < 2000) return;

    // Check for accepted submission indicators
    const successSelectors = [
      '[data-e2e-locator="submission-result"]',
      '.text-green-500',
      '[class*="text-green"]',
      '.submission-status',
      '[data-cy="submission-result"]'
    ];

    let acceptedElement = null;
    for (const selector of successSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.textContent?.includes("Accepted")) {
            acceptedElement = element;
            break;
          }
        }
        if (acceptedElement) break;
      } catch (e) {
        // Continue checking other selectors
      }
    }

    // Also check for generic success indicators
    if (!acceptedElement) {
      const successElements = document.querySelectorAll('[class*="success"], [class*="green"], .text-green-500, .text-success');
      for (const element of successElements) {
        if (element.textContent?.toLowerCase().includes("accepted") || 
            element.textContent?.toLowerCase().includes("success")) {
          acceptedElement = element;
          break;
        }
      }
    }

    if (acceptedElement && this.isOnProblemPage()) {
      console.log("Detected accepted submission");
      this.lastSubmissionTime = now;
      this.handleAcceptedSubmission();
    }
  }

  isOnProblemPage() {
    return window.location.pathname.includes("/problems/") && 
           !window.location.pathname.includes("/submissions");
  }

  async handleAcceptedSubmission() {
    try {
      // Wait for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      const solutionData = this.extractSolutionData();
      if (solutionData) {
        chrome.runtime.sendMessage(
          { type: "solved_dom", payload: solutionData },
          (response) => {
            if (response?.success) {
              console.log("Solution sent to background:", solutionData.title);
            } else {
              console.error("Failed to send solution:", response?.error);
            }
          }
        );
      }
    } catch (error) {
      console.error("Error handling accepted submission:", error);
    }
  }

  extractSolutionData() {
    try {
      // Extract title
      const titleElement = document.querySelector('[data-cy="question-title"]') ||
                          document.querySelector('h1[class*="title"]') ||
                          document.querySelector('.css-v3d350') ||
                          document.querySelector('h1');
      
      const title = titleElement?.textContent?.trim();
      if (!title) {
        console.error("Could not extract problem title");
        return null;
      }

      // Extract slug from URL
      const slugMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
      const slug = slugMatch?.[1];
      if (!slug) {
        console.error("Could not extract problem slug");
        return null;
      }

      // Extract difficulty
      const difficultyElement = document.querySelector("[diff]") ||
                               document.querySelector('[class*="difficulty"]') ||
                               document.querySelector('.css-dcmtd5');
      
      let difficulty = "Medium";
      if (difficultyElement) {
        const diffText = difficultyElement.textContent?.toLowerCase() || "";
        if (diffText.includes("easy")) difficulty = "Easy";
        else if (diffText.includes("hard")) difficulty = "Hard";
      }

      // Extract description
      const descElement = document.querySelector('[data-track-load="description_content"]') ||
                         document.querySelector('.css-1iinkds') ||
                         document.querySelector('[class*="question-content"]');
      
      const description = descElement?.textContent?.trim() || "";

      // Extract code
      const code = this.extractCodeFromEditor();
      if (!code) {
        console.error("Could not extract code from editor");
        return null;
      }

      // Extract language
      const language = this.extractLanguage();

      return {
        id: `${slug}-${language}-${Date.now()}`,
        title,
        slug,
        difficulty,
        description,
        code,
        language,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error("Error extracting solution data:", error);
      return null;
    }
  }

  extractCodeFromEditor() {
    // Try different editor types
    const editorSelectors = [
      '.monaco-editor .view-lines',
      '.CodeMirror-code',
      '[data-mode-id] .view-lines',
      '.ace_content',
      'textarea[data-cy="code-editor"]'
    ];

    for (const selector of editorSelectors) {
      const editor = document.querySelector(selector);
      if (editor) {
        if (editor.classList.contains('view-lines')) {
          // Monaco editor
          const lines = editor.querySelectorAll('.view-line');
          return Array.from(lines).map(line => line.textContent || "").join('\n');
        } else if (editor.tagName === 'TEXTAREA') {
          return editor.value;
        } else {
          return editor.textContent || "";
        }
      }
    }

    // Try Monaco API
    try {
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models.length > 0) {
          return models[0].getValue();
        }
      }
    } catch (e) {
      console.log("Could not access Monaco editor instance");
    }

    // Try global editor variable
    try {
      if (window.editor && typeof window.editor.getValue === 'function') {
        return window.editor.getValue();
      }
    } catch (e) {
      console.log("Could not access global editor");
    }

    return "";
  }

  extractLanguage() {
    // Try different language selector patterns
    const langSelectors = [
      '[data-cy="lang-select"] .ant-select-selection-item',
      '.lang-select .selected',
      '[class*="language-select"] [class*="selected"]',
      'button[data-state="selected"][role="option"]'
    ];

    for (const selector of langSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam) return langParam;

    // Intelligent detection based on code content
    const code = this.extractCodeFromEditor();
    if (code.includes('def ') || code.includes('print(')) return 'Python';
    if (code.includes('function ') || code.includes('const ') || code.includes('let ')) return 'JavaScript';
    if (code.includes('class ') && code.includes('public static')) return 'Java';
    if (code.includes('#include') || code.includes('std::')) return 'C++';

    return 'JavaScript'; // Default fallback
  }

  destroy() {
    this.stopObserving();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialize detector
const detector = new LeetCodeDetector();

// Handle page navigation in SPAs
let currentHref = window.location.href;
const navigationObserver = new MutationObserver(() => {
  if (window.location.href !== currentHref) {
    currentHref = window.location.href;
    console.log("Page navigated, reinitializing detector");
    detector.destroy();
    setTimeout(() => {
      new LeetCodeDetector();
    }, 1000);
  }
});

navigationObserver.observe(document.body, { childList: true, subtree: true });

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  detector.destroy();
  navigationObserver.disconnect();
});