// Comprehensive test for Leet2Git Chrome Extension
// Run this in Chrome DevTools console after loading the extension

async function testLeet2GitExtension() {
  console.log('🚀 Testing Leet2Git Chrome Extension Core Logic...');
  
  const tests = [];
  
  // Test 1: Storage Operations
  try {
    console.log('\n📦 Testing storage operations...');
    
    // Test pending item storage
    const testPendingItem = {
      id: 'two-sum-python-' + Date.now(),
      title: 'Two Sum',
      slug: 'two-sum',
      language: 'Python',
      difficulty: 'Easy',
      code: 'def twoSum(self, nums, target):\n    hash_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in hash_map:\n            return [hash_map[complement], i]\n        hash_map[num] = i\n    return []',
      timestamp: Date.now(),
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
    };
    
    await chrome.storage.sync.set({ 
      pending: [testPendingItem]
    });
    
    const pendingResult = await chrome.storage.sync.get(['pending']);
    if (pendingResult.pending && pendingResult.pending.length === 1) {
      tests.push({ name: 'Pending Storage', status: '✅ PASS', data: pendingResult.pending[0].title });
    } else {
      tests.push({ name: 'Pending Storage', status: '❌ FAIL', error: 'No pending items found' });
    }
    
    // Test stats storage
    const testStats = {
      streak: 5,
      lastSolveDate: new Date().toISOString(),
      counts: { easy: 3, medium: 2, hard: 0 },
      recentSolves: [{
        id: testPendingItem.id,
        title: testPendingItem.title,
        language: testPendingItem.language,
        timestamp: testPendingItem.timestamp,
        difficulty: testPendingItem.difficulty
      }]
    };
    
    await chrome.storage.sync.set({ stats: testStats });
    
    const statsResult = await chrome.storage.sync.get(['stats']);
    if (statsResult.stats && statsResult.stats.streak === 5) {
      tests.push({ name: 'Stats Storage', status: '✅ PASS', data: `Streak: ${statsResult.stats.streak}` });
    } else {
      tests.push({ name: 'Stats Storage', status: '❌ FAIL', error: 'Stats not stored correctly' });
    }
    
  } catch (error) {
    tests.push({ name: 'Storage Operations', status: '❌ FAIL', error: error.message });
  }
  
  // Test 2: GitHub Config Storage
  try {
    console.log('\n⚙️ Testing GitHub configuration...');
    
    const testConfig = {
      owner: 'test-user',
      repo: 'leetcode-solutions',
      branch: 'main',
      private: false,
      folderStructure: 'difficulty',
      includeDescription: true,
      includeTestCases: true
    };
    
    await chrome.storage.sync.set({ repo_config: testConfig });
    
    const configResult = await chrome.storage.sync.get(['repo_config']);
    if (configResult.repo_config && configResult.repo_config.owner === 'test-user') {
      tests.push({ name: 'GitHub Config', status: '✅ PASS', data: configResult.repo_config.repo });
    } else {
      tests.push({ name: 'GitHub Config', status: '❌ FAIL', error: 'Config not stored correctly' });
    }
    
  } catch (error) {
    tests.push({ name: 'GitHub Config', status: '❌ FAIL', error: error.message });
  }
  
  // Test 3: Message Communication
  try {
    console.log('\n💬 Testing background script communication...');
    
    chrome.runtime.sendMessage({ type: 'getHomeData' }, (response) => {
      if (response && response.success) {
        tests.push({ name: 'Background Communication', status: '✅ PASS', data: 'getHomeData working' });
      } else {
        tests.push({ name: 'Background Communication', status: '❌ FAIL', error: response?.error || 'No response' });
      }
      
      // Print final results
      printTestResults(tests);
    });
    
  } catch (error) {
    tests.push({ name: 'Background Communication', status: '❌ FAIL', error: error.message });
    printTestResults(tests);
  }
  
  // Test 4: Content Type Verification
  try {
    console.log('\n🔍 Testing pending item structure...');
    
    const pendingCheck = await chrome.storage.sync.get(['pending']);
    if (pendingCheck.pending && pendingCheck.pending[0]) {
      const item = pendingCheck.pending[0];
      const requiredFields = ['id', 'title', 'slug', 'language', 'difficulty', 'code', 'timestamp'];
      const missingFields = requiredFields.filter(field => !item[field]);
      
      if (missingFields.length === 0) {
        tests.push({ name: 'Data Structure', status: '✅ PASS', data: 'All required fields present' });
      } else {
        tests.push({ name: 'Data Structure', status: '❌ FAIL', error: `Missing fields: ${missingFields.join(', ')}` });
      }
    }
    
  } catch (error) {
    tests.push({ name: 'Data Structure', status: '❌ FAIL', error: error.message });
  }
}

function printTestResults(tests) {
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  
  tests.forEach(test => {
    console.log(`${test.status} ${test.name}`);
    if (test.data) console.log(`   Data: ${test.data}`);
    if (test.error) console.log(`   Error: ${test.error}`);
  });
  
  const passed = tests.filter(t => t.status.includes('✅')).length;
  const failed = tests.filter(t => t.status.includes('❌')).length;
  
  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Extension core logic is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Load the extension in Chrome (chrome://extensions/)');
    console.log('2. Enable Developer mode and click "Load unpacked"');
    console.log('3. Select the dist-extension/ folder');
    console.log('4. Go to LeetCode and solve a problem');
    console.log('5. Check chrome.storage.sync for pending[0] with code string');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
  }
}

// Auto-run the test
testLeet2GitExtension();