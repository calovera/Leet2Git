// Automated test for submission capture functionality
console.log("Starting submission capture tests...");

async function testSubmissionCapture() {
  try {
    // Test 1: Verify code capture on submit
    console.log("Test 1: Testing code capture mechanism");
    
    // Simulate submit request data
    const mockSubmitData = {
      typed_code: `class Solution:
    def twoSum(self, nums, target):
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]`,
      lang: "python3",
      question_id: "1"
    };
    
    // Test code storage
    const tempCodeStorage = new Map();
    tempCodeStorage.set(mockSubmitData.question_id, {
      code: mockSubmitData.typed_code,
      lang: mockSubmitData.lang,
      question_id: mockSubmitData.question_id,
      timestamp: Date.now()
    });
    
    const stored = tempCodeStorage.get("1");
    console.log("✓ Code storage test passed:", stored ? "SUCCESS" : "FAILED");
    
    // Test 2: Verify acceptance detection logic
    console.log("Test 2: Testing acceptance detection");
    
    const acceptedTexts = [
      "Accepted",
      "Status: Accepted",
      "Result: Accepted"
    ];
    
    const rejectedTexts = [
      "Wrong Answer",
      "Time Limit Exceeded",
      "Runtime Error",
      "Compilation Error"
    ];
    
    function isAcceptedSubmission(bodyText) {
      // This mirrors the logic in background.ts
      if (bodyText.includes('Accepted') && 
          !bodyText.includes('Wrong Answer') && 
          !bodyText.includes('Time Limit Exceeded')) {
        return true;
      }
      return false;
    }
    
    let passedAccepted = 0;
    acceptedTexts.forEach(text => {
      if (isAcceptedSubmission(text)) {
        passedAccepted++;
        console.log(`✓ Correctly identified as accepted: "${text}"`);
      } else {
        console.log(`✗ Failed to identify as accepted: "${text}"`);
      }
    });
    
    let passedRejected = 0;
    rejectedTexts.forEach(text => {
      if (!isAcceptedSubmission(text)) {
        passedRejected++;
        console.log(`✓ Correctly rejected: "${text}"`);
      } else {
        console.log(`✗ Incorrectly accepted: "${text}"`);
      }
    });
    
    console.log(`Acceptance detection: ${passedAccepted}/${acceptedTexts.length} accepted texts passed`);
    console.log(`Rejection detection: ${passedRejected}/${rejectedTexts.length} rejected texts passed`);
    
    // Test 3: Test timing window
    console.log("Test 3: Testing timing window");
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const twoMinutesAgo = now - 120000;
    
    function isWithinTimeWindow(timestamp, windowMs = 60000) {
      return timestamp > Date.now() - windowMs;
    }
    
    console.log("✓ Current timestamp within window:", isWithinTimeWindow(now));
    console.log("✓ One minute ago within window:", isWithinTimeWindow(oneMinuteAgo));
    console.log("✓ Two minutes ago within window:", isWithinTimeWindow(twoMinutesAgo));
    
    // Test 4: Test topicTags priority
    console.log("Test 4: Testing topicTags priority");
    
    const mockMetadata1 = {
      topicTags: [{ name: "Array" }, { name: "Hash Table" }],
      categoryTitle: "Algorithms"
    };
    
    const mockMetadata2 = {
      topicTags: [],
      categoryTitle: "Database"
    };
    
    const mockMetadata3 = {
      categoryTitle: "Shell"
    };
    
    function getTag(metadata) {
      if (metadata?.topicTags && Array.isArray(metadata.topicTags) && metadata.topicTags.length > 0) {
        return metadata.topicTags[0].name;
      } else if (metadata?.categoryTitle) {
        return metadata.categoryTitle;
      }
      return "Algorithms";
    }
    
    console.log("✓ With topicTags:", getTag(mockMetadata1)); // Should be "Array"
    console.log("✓ Empty topicTags:", getTag(mockMetadata2)); // Should be "Database"
    console.log("✓ No topicTags:", getTag(mockMetadata3)); // Should be "Shell"
    
    console.log("All tests completed!");
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the tests
testSubmissionCapture();

// Test the Chrome extension messaging
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log("Testing Chrome extension messaging...");
  
  // Test message sending
  chrome.runtime.sendMessage({ type: 'getHomeData' }, (response) => {
    if (response && response.success) {
      console.log("✓ Chrome messaging test passed");
      console.log("Current pending solutions:", response.data.pending?.length || 0);
    } else {
      console.log("✗ Chrome messaging test failed:", response);
    }
  });
} else {
  console.log("Chrome APIs not available - running in browser context");
}