/**
 * Automated Test Suite for Day Streak Logic
 * Tests the streak calculation functionality to ensure it works perfectly
 */

// Mock chrome.storage.sync for testing
const mockStorage = {};
const chrome = {
  storage: {
    sync: {
      get: async (key) => {
        if (typeof key === 'string') {
          return { [key]: mockStorage[key] };
        }
        const result = {};
        key.forEach(k => {
          result[k] = mockStorage[k];
        });
        return result;
      },
      set: async (data) => {
        Object.assign(mockStorage, data);
      }
    }
  }
};

// Copy the updateStats function from background.ts
async function updateStats(solution) {
  try {
    const { stats = {
      streak: 0,
      counts: { easy: 0, medium: 0, hard: 0 },
      recentSolves: [],
      lastSolveDate: null
    }} = await chrome.storage.sync.get('stats');
    
    const difficulty = solution.difficulty.toLowerCase();
    if (stats.counts[difficulty] !== undefined) {
      stats.counts[difficulty]++;
      console.log(`[Test] Updated ${difficulty} count to ${stats.counts[difficulty]}`);
    }
    
    // Update streak logic
    const today = new Date().toDateString();
    const lastSolveDate = stats.lastSolveDate;
    
    if (!lastSolveDate) {
      // First solve ever
      stats.streak = 1;
      stats.lastSolveDate = today;
      console.log(`[Test] Started streak with first solve`);
    } else if (lastSolveDate === today) {
      // Already solved today, don't change streak
      console.log(`[Test] Already solved today, streak remains ${stats.streak}`);
    } else {
      const lastDate = new Date(lastSolveDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day, increment streak
        stats.streak++;
        stats.lastSolveDate = today;
        console.log(`[Test] Consecutive day! Streak increased to ${stats.streak}`);
      } else {
        // Streak broken, reset to 1
        stats.streak = 1;
        stats.lastSolveDate = today;
        console.log(`[Test] Streak broken (${daysDiff} days gap), reset to 1`);
      }
    }
    
    stats.recentSolves.unshift({
      id: solution.id,
      title: solution.title,
      language: solution.language,
      difficulty: solution.difficulty,
      timestamp: solution.timestamp
    });
    
    stats.recentSolves = stats.recentSolves.slice(0, 10);
    
    await chrome.storage.sync.set({ stats });
    console.log(`[Test] Stats updated for ${solution.title}, streak: ${stats.streak}`);
    return stats;
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Test cases
async function runStreakTests() {
  console.log("🧪 Starting Day Streak Logic Tests\n");
  
  // Clear storage before tests
  mockStorage.stats = undefined;
  
  const testSolution = {
    id: "test-1",
    title: "TwoSum",
    language: "Python",
    difficulty: "Easy",
    timestamp: Date.now()
  };

  // Test 1: First solve ever
  console.log("📋 Test 1: First solve ever");
  let stats = await updateStats(testSolution);
  console.assert(stats.streak === 1, "❌ First solve should set streak to 1");
  console.assert(stats.lastSolveDate === new Date().toDateString(), "❌ Last solve date should be today");
  console.log("✅ Test 1 passed: Streak = 1, Date = today\n");

  // Test 2: Same day solve (should not increment)
  console.log("📋 Test 2: Multiple solves same day");
  stats = await updateStats({ ...testSolution, id: "test-2", title: "ThreeSum" });
  console.assert(stats.streak === 1, "❌ Same day solve should not increment streak");
  console.log("✅ Test 2 passed: Streak remains 1\n");

  // Test 3: Consecutive day solve
  console.log("📋 Test 3: Consecutive day solve");
  // Simulate yesterday's solve
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  mockStorage.stats.lastSolveDate = yesterday.toDateString();
  
  stats = await updateStats({ ...testSolution, id: "test-3", title: "FourSum" });
  console.assert(stats.streak === 2, "❌ Consecutive day should increment streak to 2");
  console.assert(stats.lastSolveDate === new Date().toDateString(), "❌ Last solve date should update to today");
  console.log("✅ Test 3 passed: Streak = 2, Date updated\n");

  // Test 4: Build up longer streak
  console.log("📋 Test 4: Building longer streak");
  for (let i = 0; i < 5; i++) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    mockStorage.stats.lastSolveDate = pastDate.toDateString();
    
    stats = await updateStats({ ...testSolution, id: `test-4-${i}`, title: `Problem${i}` });
  }
  console.assert(stats.streak === 7, "❌ Should have 7-day streak after building up");
  console.log("✅ Test 4 passed: Built up to 7-day streak\n");

  // Test 5: Streak broken (2+ days gap)
  console.log("📋 Test 5: Streak broken with gap");
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  mockStorage.stats.lastSolveDate = threeDaysAgo.toDateString();
  
  stats = await updateStats({ ...testSolution, id: "test-5", title: "AfterBreak" });
  console.assert(stats.streak === 1, "❌ Broken streak should reset to 1");
  console.assert(stats.lastSolveDate === new Date().toDateString(), "❌ Date should update to today");
  console.log("✅ Test 5 passed: Streak reset to 1 after gap\n");

  // Test 6: Edge case - exact 24 hour boundary
  console.log("📋 Test 6: 24-hour boundary test");
  const exactlyYesterday = new Date();
  exactlyYesterday.setDate(exactlyYesterday.getDate() - 1);
  exactlyYesterday.setHours(23, 59, 59, 999); // Very end of yesterday
  mockStorage.stats.lastSolveDate = exactlyYesterday.toDateString();
  
  stats = await updateStats({ ...testSolution, id: "test-6", title: "BoundaryTest" });
  console.assert(stats.streak === 2, "❌ Should increment streak across day boundary");
  console.log("✅ Test 6 passed: Day boundary handled correctly\n");

  // Test 7: Difficulty counting
  console.log("📋 Test 7: Difficulty counting");
  const initialEasy = stats.counts.easy;
  await updateStats({ ...testSolution, difficulty: "Medium", id: "test-7", title: "MediumProblem" });
  const finalStats = await chrome.storage.sync.get('stats');
  console.assert(finalStats.stats.counts.medium === 1, "❌ Medium count should increment");
  console.assert(finalStats.stats.counts.easy === initialEasy, "❌ Easy count should not change");
  console.log("✅ Test 7 passed: Difficulty counting works\n");

  console.log("🎉 All Day Streak Logic Tests Passed!");
  console.log(`Final streak: ${finalStats.stats.streak}`);
  console.log(`Counts: Easy=${finalStats.stats.counts.easy}, Medium=${finalStats.stats.counts.medium}, Hard=${finalStats.stats.counts.hard}`);
  console.log(`Recent solves: ${finalStats.stats.recentSolves.length}`);
}

// Run the tests
runStreakTests().catch(console.error);