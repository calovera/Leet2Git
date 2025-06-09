// Production Test for Leet2Git Chrome Extension
// Run this in Chrome DevTools console after loading the extension

async function runProductionTest() {
  console.log('🔧 Testing Production-Ready Leet2Git Extension...');
  
  const tests = [];
  
  try {
    // Test 1: Extension Background Script Communication
    console.log('\n📡 Testing background script communication...');
    
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'getHomeData' }, (response) => {
        if (chrome.runtime.lastError) {
          tests.push({ name: 'Background Communication', status: '❌ FAIL', error: chrome.runtime.lastError.message });
          reject(chrome.runtime.lastError);
        } else if (response && response.success) {
          tests.push({ name: 'Background Communication', status: '✅ PASS', data: 'Background script responding' });
          resolve(response);
        } else {
          tests.push({ name: 'Background Communication', status: '❌ FAIL', error: response?.error || 'No response' });
          reject(new Error('Invalid response'));
        }
      });
    });
    
    // Test 2: GitHub Authentication Storage
    console.log('\n🔐 Testing GitHub authentication...');
    
    const testAuth = {
      token: 'test_token_ghp_1234567890',
      username: 'test-user',
      email: 'test@example.com',
      connected: true
    };
    
    await chrome.storage.sync.set({ github_auth: testAuth });
    
    const authResult = await chrome.storage.sync.get(['github_auth']);
    if (authResult.github_auth && authResult.github_auth.token === testAuth.token) {
      tests.push({ name: 'GitHub Auth Storage', status: '✅ PASS', data: `User: ${authResult.github_auth.username}` });
    } else {
      tests.push({ name: 'GitHub Auth Storage', status: '❌ FAIL', error: 'Auth not stored correctly' });
    }
    
    // Test 3: Repository Configuration
    console.log('\n⚙️ Testing repository configuration...');
    
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
      tests.push({ name: 'Repository Config', status: '✅ PASS', data: `${configResult.repo_config.owner}/${configResult.repo_config.repo}` });
    } else {
      tests.push({ name: 'Repository Config', status: '❌ FAIL', error: 'Config not stored correctly' });
    }
    
    // Test 4: Pending Solutions Storage
    console.log('\n📋 Testing pending solutions...');
    
    const testPending = [{
      id: 'two-sum-python-' + Date.now(),
      title: 'Two Sum',
      slug: 'two-sum',
      language: 'Python',
      difficulty: 'Easy',
      code: 'def twoSum(self, nums, target):\n    hash_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in hash_map:\n            return [hash_map[complement], i]\n        hash_map[num] = i\n    return []',
      timestamp: Date.now(),
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
    }];
    
    await chrome.storage.sync.set({ pending: testPending });
    
    const pendingResult = await chrome.storage.sync.get(['pending']);
    if (pendingResult.pending && pendingResult.pending.length === 1 && pendingResult.pending[0].code.includes('def twoSum')) {
      tests.push({ name: 'Pending Solutions', status: '✅ PASS', data: `${pendingResult.pending.length} solution with code` });
    } else {
      tests.push({ name: 'Pending Solutions', status: '❌ FAIL', error: 'Pending solutions not stored with code' });
    }
    
    // Test 5: Statistics Storage
    console.log('\n📊 Testing statistics...');
    
    const testStats = {
      streak: 7,
      lastSolveDate: new Date().toISOString(),
      counts: { easy: 5, medium: 3, hard: 1 },
      recentSolves: [{
        id: testPending[0].id,
        title: testPending[0].title,
        language: testPending[0].language,
        timestamp: testPending[0].timestamp,
        difficulty: testPending[0].difficulty
      }]
    };
    
    await chrome.storage.sync.set({ stats: testStats });
    
    const statsResult = await chrome.storage.sync.get(['stats']);
    if (statsResult.stats && statsResult.stats.streak === 7) {
      tests.push({ name: 'Statistics Storage', status: '✅ PASS', data: `Streak: ${statsResult.stats.streak}, Total: ${Object.values(statsResult.stats.counts).reduce((a, b) => a + b, 0)}` });
    } else {
      tests.push({ name: 'Statistics Storage', status: '❌ FAIL', error: 'Stats not stored correctly' });
    }
    
    // Test 6: Push Validation (without GitHub token)
    console.log('\n🚀 Testing push validation...');
    
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'push' }, (response) => {
        if (response && response.error && (response.error.includes('GitHub not connected') || response.error.includes('Repository owner not configured'))) {
          tests.push({ name: 'Push Validation', status: '✅ PASS', data: 'Properly validates GitHub connection' });
        } else {
          tests.push({ name: 'Push Validation', status: '❌ FAIL', error: 'Should require GitHub connection' });
        }
        resolve(response);
      });
    });
    
    // Test 7: Options Page Accessibility
    console.log('\n⚙️ Testing options page...');
    
    try {
      chrome.runtime.openOptionsPage();
      tests.push({ name: 'Options Page', status: '✅ PASS', data: 'Options page opened successfully' });
    } catch (error) {
      tests.push({ name: 'Options Page', status: '❌ FAIL', error: error.message });
    }
    
  } catch (error) {
    tests.push({ name: 'Test Suite', status: '❌ FAIL', error: error.message });
  }
  
  // Print results
  console.log('\n📊 PRODUCTION TEST RESULTS:');
  console.log('============================');
  
  tests.forEach(test => {
    console.log(`${test.status} ${test.name}`);
    if (test.data) console.log(`   ✓ ${test.data}`);
    if (test.error) console.log(`   ✗ ${test.error}`);
  });
  
  const passed = tests.filter(t => t.status.includes('✅')).length;
  const failed = tests.filter(t => t.status.includes('❌')).length;
  
  console.log(`\n📈 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Extension is production-ready.');
    console.log('\n📝 Installation Instructions:');
    console.log('1. Open Chrome and go to chrome://extensions/');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked"');
    console.log('4. Select the dist-extension/ folder');
    console.log('5. Click the options button to configure GitHub token');
    console.log('6. Go to LeetCode and solve a problem');
    console.log('7. Solutions will automatically be captured and synced');
  } else {
    console.log('\n⚠️ Some tests failed. Extension needs fixes before production use.');
  }
  
  return { passed, failed, tests };
}

// Auto-run the production test
runProductionTest();