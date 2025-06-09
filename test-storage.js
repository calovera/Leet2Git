// Test script to verify chrome.storage.sync functionality
// Run this in Chrome DevTools console after loading the extension

async function testStorage() {
  console.log('Testing Leet2Git storage functionality...');
  
  // Test basic storage operations
  try {
    // Test setting pending items
    const testPendingItem = {
      id: 'two-sum-python-test',
      title: 'Two Sum',
      slug: 'two-sum',
      language: 'Python',
      difficulty: 'Easy',
      code: 'def twoSum(self, nums, target):\n    # Test solution code\n    return []',
      timestamp: Date.now(),
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
    };
    
    await chrome.storage.sync.set({ 
      pending: [testPendingItem],
      stats: {
        streak: 1,
        lastSolveDate: new Date().toISOString(),
        counts: { easy: 1, medium: 0, hard: 0 },
        recentSolves: [{
          id: testPendingItem.id,
          title: testPendingItem.title,
          language: testPendingItem.language,
          timestamp: testPendingItem.timestamp,
          difficulty: testPendingItem.difficulty
        }]
      }
    });
    
    console.log('✅ Set test data successfully');
    
    // Test retrieving data
    const result = await chrome.storage.sync.get(['pending', 'stats']);
    console.log('✅ Retrieved data:', result);
    
    if (result.pending && result.pending.length === 1) {
      console.log('✅ Pending item stored correctly:', result.pending[0].title);
    }
    
    if (result.stats && result.stats.streak === 1) {
      console.log('✅ Stats stored correctly, streak:', result.stats.streak);
    }
    
    console.log('🎉 Storage test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return false;
  }
}

// Run the test
testStorage();