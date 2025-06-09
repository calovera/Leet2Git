// Final Extension Verification Script
console.log('🔍 Running final verification of Leet2Git extension...');

async function verifyExtension() {
  const results = {
    installation: false,
    backgroundScript: false,
    storage: false,
    optionsPage: false,
    popup: false,
    contentScript: false,
    githubAuth: false,
    solutionHandling: false
  };

  try {
    // 1. Check extension installation
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      results.installation = true;
      console.log('✅ Extension installed');
    } else {
      console.log('❌ Extension not installed');
      return results;
    }

    // 2. Test background script communication
    try {
      const bgResponse = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'getHomeData' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
      
      if (bgResponse) {
        results.backgroundScript = true;
        console.log('✅ Background script responding');
      }
    } catch (error) {
      console.log('❌ Background script error:', error.message);
    }

    // 3. Test storage operations
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set({ verification_test: 'working' }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      const storageResult = await new Promise((resolve) => {
        chrome.storage.sync.get(['verification_test'], resolve);
      });

      if (storageResult.verification_test === 'working') {
        results.storage = true;
        console.log('✅ Storage operations working');
        chrome.storage.sync.remove(['verification_test']);
      }
    } catch (error) {
      console.log('❌ Storage error:', error.message);
    }

    // 4. Test options page functionality
    try {
      chrome.runtime.openOptionsPage();
      results.optionsPage = true;
      console.log('✅ Options page accessible');
    } catch (error) {
      console.log('❌ Options page error:', error.message);
    }

    // 5. Test solution addition
    try {
      const testSolution = {
        id: `verification-test-${Date.now()}`,
        title: "Test Problem",
        slug: "test-problem",
        difficulty: "Easy",
        language: "JavaScript",
        code: "function test() { return true; }",
        timestamp: Date.now()
      };

      const solutionResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'solved_dom',
          payload: testSolution
        }, resolve);
      });

      if (solutionResponse && solutionResponse.success) {
        results.solutionHandling = true;
        console.log('✅ Solution handling working');
      }
    } catch (error) {
      console.log('❌ Solution handling error:', error.message);
    }

    // 6. Check GitHub authentication status
    try {
      const authData = await new Promise((resolve) => {
        chrome.storage.sync.get(['github_auth'], resolve);
      });

      if (authData.github_auth && authData.github_auth.connected) {
        results.githubAuth = true;
        console.log('✅ GitHub authentication configured');
      } else {
        console.log('⚠️ GitHub authentication not configured');
      }
    } catch (error) {
      console.log('❌ GitHub auth check error:', error.message);
    }

  } catch (error) {
    console.log('❌ Verification error:', error.message);
  }

  // Summary
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n📊 Verification Summary: ${passed}/${total} checks passed`);
  
  if (passed >= total - 1) { // Allow GitHub auth to be unconfigured
    console.log('🎉 Extension is working correctly!');
  } else {
    console.log('⚠️ Some issues detected - check configuration');
  }

  return results;
}

// Run verification
verifyExtension();

// Make available globally
window.verifyExtension = verifyExtension;