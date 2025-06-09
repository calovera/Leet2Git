// Leet2Git Content Script - GraphQL Metadata Capture
console.log("Leet2Git content script loaded");

// Enhanced GraphQL interception - multiple approaches
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    console.log('[Leet2Git] Fetch intercepted:', url);
    
    if (url.includes('/graphql')) {
      console.log('[Leet2Git] GraphQL request detected');
      
      return originalFetch.call(this, input, init).then(async (response) => {
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          try {
            const clonedResponse = response.clone();
            const data = await clonedResponse.json();
            
            console.log('[Leet2Git] GraphQL response data:', data);
            
            if (data?.data?.question) {
              const questionData = {
                slug: data.data.question.titleSlug,
                title: data.data.question.title,
                difficulty: data.data.question.difficulty,
                categoryTitle: data.data.question.categoryTitle,
                topicTags: data.data.question.topicTags || []
              };
              
              console.log('[Leet2Git] Question data extracted:', questionData);
              
              chrome.runtime.sendMessage({
                type: 'graphql_question_data',
                data: questionData
              }, (response) => {
                console.log('[Leet2Git] Background response:', response);
              });
            }
          } catch (error) {
            console.error('[Leet2Git] Error processing GraphQL response:', error);
          }
        }
        return response;
      });
    }
    
    return originalFetch.call(this, input, init);
  };
})();

// Additional approach: Monitor DOM for question data
function extractQuestionFromDOM() {
  try {
    // Try to find question data in script tags
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      if (content.includes('questionId') && content.includes('topicTags')) {
        console.log('[Leet2Git] Found question data in DOM script');
        
        // Try to extract JSON data
        const matches = content.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
        if (matches) {
          try {
            const initialState = JSON.parse(matches[1]);
            console.log('[Leet2Git] Initial state extracted:', initialState);
            
            // Look for question data in various possible locations
            const question = initialState?.questionDetail?.question || 
                           initialState?.question || 
                           initialState?.data?.question;
                           
            if (question && question.titleSlug) {
              const questionData = {
                slug: question.titleSlug,
                title: question.title,
                difficulty: question.difficulty,
                categoryTitle: question.categoryTitle,
                topicTags: question.topicTags || []
              };
              
              console.log('[Leet2Git] Question data from DOM:', questionData);
              
              chrome.runtime.sendMessage({
                type: 'graphql_question_data',
                data: questionData
              });
            }
          } catch (e) {
            console.log('[Leet2Git] Failed to parse initial state:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('[Leet2Git] Error extracting from DOM:', error);
  }
}

// Try DOM extraction on page load and when URL changes
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', extractQuestionFromDOM);
} else {
  extractQuestionFromDOM();
}

// Also try when navigating to a problem page
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (url.includes('/problems/')) {
      console.log('[Leet2Git] URL changed to problem page:', url);
      setTimeout(extractQuestionFromDOM, 1000); // Wait for page to load
    }
  }
}).observe(document, { subtree: true, childList: true });

// Intercept XMLHttpRequest for additional GraphQL capture
(function() {
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    this._method = method;
    this._url = typeof url === 'string' ? url : url.href;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    if (this._method === 'POST' && this._url?.includes('/graphql')) {
      const originalOnLoad = this.onload;
      
      this.onload = function(event) {
        try {
          if (this.responseText && this.getResponseHeader('content-type')?.includes('application/json')) {
            const data = JSON.parse(this.responseText);
            
            if (data?.data?.question) {
              const questionData = {
                slug: data.data.question.titleSlug,
                title: data.data.question.title,
                difficulty: data.data.question.difficulty,
                categoryTitle: data.data.question.categoryTitle,
                topicTags: data.data.question.topicTags || []
              };
              
              chrome.runtime.sendMessage({
                type: 'graphql_question_data',
                data: questionData
              }, (response) => {
                if (response?.success) {
                  console.log('[Leet2Git] XHR GraphQL metadata sent:', questionData.title);
                }
              });
            }
          }
        } catch (error) {
          console.error('[Leet2Git] Error processing XHR GraphQL response:', error);
        }
        
        if (originalOnLoad) {
          originalOnLoad.call(this, event);
        }
      };
    }
    
    return originalXHRSend.call(this, body);
  };
})();