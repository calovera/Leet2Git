// Content script to capture GraphQL responses for metadata
console.log('[Leet2Git] Content script loaded');

// Intercept fetch requests to capture GraphQL responses
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  
  // Check if this is a GraphQL request
  if (args[0]?.includes?.('/graphql') || 
      (typeof args[0] === 'object' && (args[0] as any).url?.includes('/graphql'))) {
    
    // Clone the response to read it without consuming the original
    const clonedResponse = response.clone();
    
    try {
      const data = await clonedResponse.json();
      
      // Check if this contains question metadata
      if (data?.data?.question) {
        const questionData = data.data.question;
        
        // Send metadata to background script
        chrome.runtime.sendMessage({
          type: 'graphql_question_data',
          payload: {
            slug: questionData.titleSlug,
            title: questionData.title,
            difficulty: questionData.difficulty,
            topicTags: questionData.topicTags,
            categoryTitle: questionData.categoryTitle
          }
        });
        
        console.log('[Leet2Git] Captured question metadata:', questionData.titleSlug);
      }
    } catch (error) {
      // Ignore JSON parsing errors
    }
  }
  
  return response;
};

// Also intercept XMLHttpRequest for older requests
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
  (this as any)._url = url;
  (this as any)._method = method;
  return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(body) {
  if ((this as any)._url?.includes('/graphql') && (this as any)._method === 'POST') {
    const originalOnLoad = this.onload;
    
    this.onload = function(e) {
      try {
        const response = JSON.parse(this.responseText);
        
        if (response?.data?.question) {
          const questionData = response.data.question;
          
          chrome.runtime.sendMessage({
            type: 'graphql_question_data',
            payload: {
              slug: questionData.titleSlug,
              title: questionData.title,
              difficulty: questionData.difficulty,
              topicTags: questionData.topicTags,
              categoryTitle: questionData.categoryTitle
            }
          });
          
          console.log('[Leet2Git] Captured question metadata via XHR:', questionData.titleSlug);
        }
      } catch (error) {
        // Ignore parsing errors
      }
      
      if (originalOnLoad) {
        originalOnLoad.apply(this, arguments);
      }
    };
  }
  
  return originalXHRSend.apply(this, arguments);
};