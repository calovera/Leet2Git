console.log("Leet2Git content script loaded");

// Simple GraphQL interception
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
  let url: string;
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.href;
  } else {
    url = input.url;
  }
  
  if (url.includes('graphql')) {
    console.log('[Leet2Git] GraphQL request detected:', url);
    
    return originalFetch(input, init).then(async response => {
      if (response.ok) {
        const clone = response.clone();
        try {
          const data = await clone.json();
          console.log('[Leet2Git] GraphQL response data:', data);
          
          if (data?.data?.question?.topicTags) {
            console.log('[Leet2Git] TopicTags found:', data.data.question.topicTags);
            
            chrome.runtime.sendMessage({
              type: 'graphql_question_data',
              data: {
                slug: data.data.question.titleSlug,
                title: data.data.question.title,
                difficulty: data.data.question.difficulty,
                categoryTitle: data.data.question.categoryTitle,
                topicTags: data.data.question.topicTags
              }
            });
          }
        } catch (e) {
          console.log('[Leet2Git] JSON parse error:', e);
        }
      }
      return response;
    });
  }
  
  return originalFetch(input, init);
};

console.log('[Leet2Git] GraphQL interception installed');