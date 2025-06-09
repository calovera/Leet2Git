// Test Solution for LeetCode Detection
console.log("🧪 Testing Leet2Git solution detection...");

// Add a test solution to verify the extension works
async function addTestSolution() {
  const testSolution = {
    id: `two-sum-javascript-${Date.now()}`,
    title: "Two Sum",
    slug: "two-sum", 
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    code: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
    language: "JavaScript",
    timestamp: Date.now()
  };

  try {
    // Add to pending solutions via background script
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'solved_dom',
        payload: testSolution
      }, resolve);
    });

    if (response?.success) {
      console.log("✅ Test solution added successfully!");
      console.log("📝 Solution:", testSolution.title);
      console.log("💾 Check the Push tab in the extension popup");
    } else {
      console.log("❌ Failed to add test solution:", response?.error);
    }
  } catch (error) {
    console.log("❌ Error adding test solution:", error);
  }
}

// Run the test
addTestSolution();

// Also make it available globally for manual testing
window.addTestSolution = addTestSolution;