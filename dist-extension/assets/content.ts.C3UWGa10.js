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
    // Check if this is a questionDetail request
    let isQuestionDetail = false;
    if (init && init.body) {
      try {
        const body = typeof init.body === 'string' ? init.body : init.body.toString();
        const parsed = JSON.parse(body);
        isQuestionDetail = parsed.operationName === 'questionDetail';
      } catch (e) {
        // ignore parse errors
      }
    }
    
    if (isQuestionDetail) {
      console.log('[Leet2Git] questionDetail GraphQL request intercepted');
      
      return originalFetch(input, init).then(async response => {
        if (response.ok) {
          const clone = response.clone();
          try {
            const data = await clone.json();
            console.log('[Leet2Git] questionDetail response:', data);
            
            const question = data?.data?.question;
            if (question && question.topicTags) {
              console.log('[Leet2Git] TopicTags found!', question.topicTags);
              console.log('[Leet2Git] First topic tag:', question.topicTags[0]?.name);
              
              // Send to content script via custom event
              window.dispatchEvent(new CustomEvent('leetcode-question-data', {
                detail: {
                  slug: question.titleSlug,
                  title: question.title,
                  difficulty: question.difficulty,
                  categoryTitle: question.categoryTitle,
                  topicTags: question.topicTags
                }
              }));
            } else {
              console.log('[Leet2Git] No question or topicTags in response');
            }
          } catch (e) {
            console.log('[Leet2Git] Parse error:', e);
          }
        }
        return response;
      });
    }
  }
  
  return originalFetch(input, init);
};

console.log('[Leet2Git] Main world fetch override installed');
`;document.documentElement.appendChild(e);e.remove();window.addEventListener("leetcode-question-data",t=>{console.log("[Leet2Git] Received question data from main world:",t.detail),chrome.runtime.sendMessage({type:"graphql_question_data",data:t.detail},i=>{console.log("[Leet2Git] Sent to background script, response:",i)})});console.log("[Leet2Git] Content script loaded and event listener set up");
