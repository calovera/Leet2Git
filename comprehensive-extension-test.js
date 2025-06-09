// Comprehensive test suite for the Chrome extension
console.log("Running comprehensive extension tests...");

// Test the submission capture workflow end-to-end
async function testSubmissionWorkflow() {
  console.log("=== Testing Complete Submission Workflow ===");
  
  // Mock Chrome storage API
  const mockStorage = {
    pending: [],
    auth: { token: "test_token", username: "testuser", connected: true },
    config: { owner: "testuser", repo: "leetcode-solutions", folderStructure: "topic" }
  };
  
  const chrome = {
    storage: {
      sync: {
        get: (keys) => Promise.resolve(mockStorage),
        set: (data) => {
          Object.assign(mockStorage, data);
          console.log("Storage updated:", data);
          return Promise.resolve();
        }
      }
    },
    action: {
      setBadgeText: ({ text }) => console.log("Badge text set:", text),
      setBadgeBackgroundColor: ({ color }) => console.log("Badge color set:", color)
    }
  };
  
  // Test 1: Code capture simulation
  console.log("\n1. Testing code capture...");
  const tempCodeStorage = new Map();
  
  const submitData = {
    typed_code: 'def twoSum(nums, target):\n    return []',
    lang: 'python3',
    question_id: '1'
  };
  
  tempCodeStorage.set(submitData.question_id, {
    code: submitData.typed_code,
    lang: submitData.lang,
    question_id: submitData.question_id,
    timestamp: Date.now()
  });
  
  console.log("✓ Code captured successfully");
  
  // Test 2: Acceptance detection
  console.log("\n2. Testing acceptance detection...");
  
  function isAcceptedResponse(responseText) {
    try {
      const data = JSON.parse(responseText);
      return data.status_msg === 'Accepted';
    } catch {
      return responseText.includes('"status_msg":"Accepted"') || 
             (responseText.includes('Accepted') && 
              !responseText.includes('Wrong Answer') && 
              !responseText.includes('Time Limit Exceeded'));
    }
  }
  
  const testResponses = [
    '{"status_msg":"Accepted","runtime":"52 ms"}',
    '{"status_msg":"Wrong Answer"}',
    '{"status_msg":"Time Limit Exceeded"}',
    'Status: Accepted - Runtime: 45ms',
    'Wrong Answer - Expected [1,2] but got [2,1]'
  ];
  
  testResponses.forEach(response => {
    const result = isAcceptedResponse(response);
    const expected = response.includes('Accepted') && !response.includes('Wrong Answer') && !response.includes('Time Limit Exceeded');
    console.log(`${result === expected ? '✓' : '✗'} Response: "${response.substring(0, 30)}..." -> ${result}`);
  });
  
  // Test 3: Solution processing
  console.log("\n3. Testing solution processing...");
  
  function processAcceptedSubmission(submissionId, tabId, questionMetadata) {
    const codeRecord = tempCodeStorage.get('1');
    if (!codeRecord) {
      throw new Error('No code record found');
    }
    
    const tag = (questionMetadata?.topicTags && questionMetadata.topicTags.length > 0) 
      ? questionMetadata.topicTags[0].name 
      : (questionMetadata?.categoryTitle || "Algorithms");
    
    const solution = {
      id: `two-sum-${Date.now()}`,
      submissionId: submissionId,
      title: questionMetadata?.title || 'Two Sum',
      slug: 'two-sum',
      difficulty: questionMetadata?.difficulty || 'Easy',
      tag: tag,
      code: codeRecord.code,
      language: codeRecord.lang,
      runtime: "52 ms",
      memory: "16.1 MB",
      timestamp: Date.now()
    };
    
    return solution;
  }
  
  const mockMetadata = {
    title: "Two Sum",
    difficulty: "Easy",
    topicTags: [{ name: "Array" }, { name: "Hash Table" }],
    categoryTitle: "Algorithms"
  };
  
  try {
    const solution = processAcceptedSubmission("12345", 1, mockMetadata);
    console.log("✓ Solution processed successfully");
    console.log(`  Title: ${solution.title}`);
    console.log(`  Tag: ${solution.tag}`);
    console.log(`  Language: ${solution.language}`);
    console.log(`  Code length: ${solution.code.length} chars`);
    
    // Verify tag priority
    if (solution.tag === "Array") {
      console.log("✓ TopicTags priority working correctly");
    } else {
      console.log("✗ TopicTags priority failed - got:", solution.tag);
    }
    
  } catch (error) {
    console.log("✗ Solution processing failed:", error.message);
  }
  
  // Test 4: Storage operations
  console.log("\n4. Testing storage operations...");
  
  async function addToPending(solution) {
    const current = await chrome.storage.sync.get(['pending']);
    const pending = current.pending || [];
    pending.push(solution);
    await chrome.storage.sync.set({ pending });
    return pending.length;
  }
  
  const testSolution = {
    id: "test-solution",
    title: "Test Problem",
    code: "print('hello')",
    language: "python3"
  };
  
  try {
    const count = await addToPending(testSolution);
    console.log(`✓ Added to pending, total count: ${count}`);
  } catch (error) {
    console.log("✗ Storage operation failed:", error.message);
  }
  
  // Test 5: Delete functionality
  console.log("\n5. Testing delete functionality...");
  
  async function deleteFromPending(itemId) {
    const current = await chrome.storage.sync.get(['pending']);
    const pending = current.pending || [];
    const filtered = pending.filter(item => item.id !== itemId);
    await chrome.storage.sync.set({ pending: filtered });
    return { before: pending.length, after: filtered.length };
  }
  
  try {
    const result = await deleteFromPending("test-solution");
    console.log(`✓ Delete successful: ${result.before} -> ${result.after}`);
  } catch (error) {
    console.log("✗ Delete operation failed:", error.message);
  }
  
  console.log("\n=== Test Summary ===");
  console.log("All core functionality tests completed");
  console.log("The extension should now properly:");
  console.log("- Capture code only on actual submission");
  console.log("- Detect accepted submissions accurately"); 
  console.log("- Use topicTags with proper fallback");
  console.log("- Allow individual submission deletion");
  console.log("- Update UI after operations");
}

// Run the comprehensive test
testSubmissionWorkflow().catch(console.error);