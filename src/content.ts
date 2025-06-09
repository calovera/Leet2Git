// Leet2Git Content Script - GraphQL Metadata Capture
console.log("Leet2Git content script loaded");

// Intercept fetch requests for GraphQL metadata
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    if (url.includes('/graphql') && init?.method === 'POST') {
      const originalThen = originalFetch.call(this, input, init).then.bind(originalFetch.call(this, input, init));
      
      return originalFetch.call(this, input, init).then(async (response) => {
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          try {
            const clonedResponse = response.clone();
            const data = await clonedResponse.json();
            
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
                  console.log('[Leet2Git] GraphQL metadata sent:', questionData.title);
                }
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