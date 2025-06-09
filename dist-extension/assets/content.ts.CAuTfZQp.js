const e=document.createElement("script");e.textContent=`
console.log("Leet2Git injected script loaded");

// Override fetch in main world
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  let url;
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.href;
  } else {
    url = input.url;
  }
  
  if (url && url.includes('graphql')) {
    console.log('[Leet2Git] GraphQL request intercepted:', url);
    
    return originalFetch(input, init).then(async response => {
      if (response.ok) {
        const clone = response.clone();
        try {
          const data = await clone.json();
          console.log('[Leet2Git] GraphQL response:', data);
          
          if (data?.data?.question?.topicTags) {
            console.log('[Leet2Git] TopicTags found!', data.data.question.topicTags);
            
            // Send to content script via custom event
            window.dispatchEvent(new CustomEvent('leetcode-question-data', {
              detail: {
                slug: data.data.question.titleSlug,
                title: data.data.question.title,
                difficulty: data.data.question.difficulty,
                categoryTitle: data.data.question.categoryTitle,
                topicTags: data.data.question.topicTags
              }
            }));
          }
        } catch (e) {
          console.log('[Leet2Git] Parse error:', e);
        }
      }
      return response;
    });
  }
  
  return originalFetch(input, init);
};

console.log('[Leet2Git] Main world fetch override installed');
`;document.documentElement.appendChild(e);e.remove();window.addEventListener("leetcode-question-data",t=>{console.log("[Leet2Git] Received question data from main world:",t.detail),chrome.runtime.sendMessage({type:"graphql_question_data",data:t.detail},n=>{console.log("[Leet2Git] Sent to background script, response:",n)})});console.log("[Leet2Git] Content script loaded and event listener set up");
