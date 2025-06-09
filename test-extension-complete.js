// Test Chrome Extension Complete Functionality
async function testChromeExtension() {
  console.log("🔧 Testing Leet2Git Chrome Extension...");
  
  // Test 1: Extension Installation
  console.log("\n1. Testing Extension Installation:");
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log("✅ Extension installed and Chrome APIs available");
  } else {
    console.log("❌ Extension not installed or Chrome APIs not available");
    return;
  }

  // Test 2: Background Script Communication
  console.log("\n2. Testing Background Script:");
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getHomeData' }, resolve);
    });
    
    if (response) {
      console.log("✅ Background script responding");
      console.log("Response:", response);
    } else {
      console.log("❌ No response from background script");
    }
  } catch (error) {
    console.log("❌ Background script error:", error);
  }

  // Test 3: Storage Operations
  console.log("\n3. Testing Storage:");
  try {
    const testData = { test_key: "test_value", timestamp: Date.now() };
    
    // Test storage write
    await new Promise((resolve, reject) => {
      chrome.storage.sync.set(testData, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
    
    // Test storage read
    const result = await new Promise((resolve, reject) => {
      chrome.storage.sync.get(['test_key', 'timestamp'], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });
    
    if (result.test_key === testData.test_key) {
      console.log("✅ Storage operations working");
    } else {
      console.log("❌ Storage data mismatch");
    }
    
    // Cleanup
    chrome.storage.sync.remove(['test_key', 'timestamp']);
    
  } catch (error) {
    console.log("❌ Storage error:", error);
  }

  // Test 4: GitHub Auth Storage
  console.log("\n4. Testing GitHub Auth Storage:");
  try {
    const authData = await new Promise((resolve) => {
      chrome.storage.sync.get(['github_auth'], resolve);
    });
    
    console.log("GitHub auth data:", authData);
    
    if (authData.github_auth && authData.github_auth.connected) {
      console.log("✅ GitHub authentication found");
      console.log("Username:", authData.github_auth.username);
    } else {
      console.log("⚠️ No GitHub authentication configured");
    }
  } catch (error) {
    console.log("❌ Auth storage error:", error);
  }

  // Test 5: Repository Config
  console.log("\n5. Testing Repository Config:");
  try {
    const configData = await new Promise((resolve) => {
      chrome.storage.sync.get(['repo_config'], resolve);
    });
    
    console.log("Repository config:", configData);
    
    if (configData.repo_config && configData.repo_config.owner && configData.repo_config.repo) {
      console.log("✅ Repository configuration found");
      console.log("Repository:", `${configData.repo_config.owner}/${configData.repo_config.repo}`);
    } else {
      console.log("⚠️ No repository configuration found");
    }
  } catch (error) {
    console.log("❌ Config storage error:", error);
  }

  // Test 6: Pending Solutions
  console.log("\n6. Testing Pending Solutions:");
  try {
    const pendingData = await new Promise((resolve) => {
      chrome.storage.sync.get(['pending'], resolve);
    });
    
    console.log("Pending solutions:", pendingData);
    
    if (pendingData.pending && Array.isArray(pendingData.pending)) {
      console.log(`✅ Found ${pendingData.pending.length} pending solutions`);
      if (pendingData.pending.length > 0) {
        console.log("Latest solution:", pendingData.pending[pendingData.pending.length - 1]);
      }
    } else {
      console.log("⚠️ No pending solutions found");
    }
  } catch (error) {
    console.log("❌ Pending storage error:", error);
  }

  // Test 7: Add Test Solution
  console.log("\n7. Testing Add Solution:");
  try {
    const testSolution = {
      id: `test-solution-${Date.now()}`,
      title: "Test Problem",
      slug: "test-problem",
      difficulty: "Easy",
      language: "JavaScript",
      code: "function testSolution() { return 'Hello World'; }",
      timestamp: Date.now()
    };

    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        type: 'solved_dom', 
        payload: testSolution 
      }, resolve);
    });

    if (response && response.success) {
      console.log("✅ Successfully added test solution");
      
      // Verify it was stored
      const updatedPending = await new Promise((resolve) => {
        chrome.storage.sync.get(['pending'], resolve);
      });
      
      console.log(`Updated pending count: ${updatedPending.pending?.length || 0}`);
    } else {
      console.log("❌ Failed to add test solution:", response);
    }
  } catch (error) {
    console.log("❌ Add solution error:", error);
  }

  console.log("\n🏁 Extension test complete!");
}

// Run the test
testChromeExtension();

// Also export for manual execution
window.testExtension = testChromeExtension;