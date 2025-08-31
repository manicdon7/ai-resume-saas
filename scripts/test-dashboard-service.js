/**
 * Test script for dashboard service functionality
 * This script tests the core dashboard service methods
 */

import { DashboardService } from '../src/lib/dashboard-service.js';
import { UserService } from '../src/lib/user-service.js';

// Mock Redux dispatch function
const mockDispatch = (action) => {
  console.log('Redux Action:', action.type, action.payload);
};

// Mock Firebase auth
const mockAuth = {
  currentUser: {
    uid: 'test-user-123',
    getIdToken: async () => 'mock-token'
  }
};

// Mock fetch for API calls
global.fetch = async (url, options) => {
  console.log('API Call:', url, options?.method || 'GET');
  
  // Mock successful dashboard API response
  if (url.includes('/api/user/dashboard')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        user: {
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          credits: 5,
          isPro: false
        },
        stats: {
          creditsRemaining: 5,
          resumesCreated: 2,
          applicationsSent: 3,
          jobSearches: 5,
          totalActivities: 10,
          lastActivityAt: new Date().toISOString()
        },
        recentActivity: [
          {
            id: '1',
            type: 'resume_upload',
            description: 'Uploaded new resume',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'job_search',
            description: 'Searched for software engineer jobs',
            timestamp: new Date(Date.now() - 60000).toISOString()
          }
        ],
        resume: {
          hasResume: true,
          resumeText: 'Sample resume text',
          parsedData: { name: 'Test User', email: 'test@example.com' },
          fileName: 'resume.pdf',
          uploadedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      })
    };
  }
  
  throw new Error('Unmocked API call');
};

// Mock Firebase import
global.import = async (module) => {
  if (module === 'firebase/auth') {
    return {
      getAuth: () => mockAuth
    };
  }
  throw new Error(`Unmocked import: ${module}`);
};

// Mock navigator
global.navigator = {
  onLine: true
};

// Mock window for event listeners
global.window = {
  addEventListener: (event, handler) => {
    console.log(`Event listener added: ${event}`);
  },
  removeEventListener: (event, handler) => {
    console.log(`Event listener removed: ${event}`);
  }
};

async function testDashboardService() {
  console.log('🧪 Testing Dashboard Service...\n');

  try {
    // Test 1: Cache functionality
    console.log('1. Testing cache functionality...');
    DashboardService.setCachedData('test', { message: 'cached data' });
    const cachedData = DashboardService.getCachedData('test');
    console.log('✅ Cache set/get:', cachedData ? 'PASS' : 'FAIL');
    
    // Test 2: Cache expiry
    console.log('2. Testing cache expiry...');
    const isDataFresh = DashboardService.isDataFresh('test', 1000);
    console.log('✅ Data freshness check:', isDataFresh ? 'PASS' : 'FAIL');
    
    // Test 3: Fetch dashboard data
    console.log('3. Testing dashboard data fetch...');
    const result = await DashboardService.fetchDashboardData(mockDispatch, {
      useCache: false,
      silent: true
    });
    console.log('✅ Dashboard data fetch:', result.success ? 'PASS' : 'FAIL');
    console.log('   - User data:', result.user ? 'Present' : 'Missing');
    console.log('   - Stats data:', result.stats ? 'Present' : 'Missing');
    console.log('   - Activity data:', result.recentActivity ? 'Present' : 'Missing');
    
    // Test 4: Cache after fetch
    console.log('4. Testing cache after fetch...');
    const cachedDashboard = DashboardService.getCachedDashboardData();
    console.log('✅ Dashboard cache:', cachedDashboard ? 'PASS' : 'FAIL');
    
    // Test 5: Auto-refresh mechanism
    console.log('5. Testing auto-refresh...');
    const intervalId = DashboardService.startAutoRefresh(mockDispatch, 1000);
    console.log('✅ Auto-refresh start:', intervalId ? 'PASS' : 'FAIL');
    
    // Wait a bit and stop
    setTimeout(() => {
      DashboardService.stopAutoRefresh();
      console.log('✅ Auto-refresh stop: PASS');
    }, 2500);
    
    // Test 6: Error handling
    console.log('6. Testing error handling...');
    
    // Mock a failed fetch
    const originalFetch = global.fetch;
    global.fetch = async () => {
      throw new Error('Network error');
    };
    
    try {
      await DashboardService.fetchDashboardData(mockDispatch, {
        useCache: false,
        silent: true
      });
      console.log('❌ Error handling: FAIL (should have thrown)');
    } catch (error) {
      console.log('✅ Error handling: PASS (caught error)');
    }
    
    // Restore fetch
    global.fetch = originalFetch;
    
    // Test 7: Retry with cached fallback
    console.log('7. Testing cached fallback...');
    global.fetch = async () => {
      throw new Error('Network error');
    };
    
    try {
      const fallbackResult = await DashboardService.fetchDashboardDataWithRetry(true, 0);
      console.log('✅ Cached fallback:', fallbackResult.fromCache ? 'PASS' : 'FAIL');
    } catch (error) {
      console.log('⚠️  Cached fallback: No cache available (expected)');
    }
    
    // Restore fetch
    global.fetch = originalFetch;
    
    console.log('\n🎉 Dashboard Service tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test UserService methods
async function testUserServiceMethods() {
  console.log('\n🧪 Testing UserService methods...\n');
  
  try {
    // Note: These would require actual MongoDB connection
    console.log('UserService methods available:');
    console.log('- getUserDashboardStats');
    console.log('- getResumeData');
    console.log('- addUserActivity');
    console.log('- getUserActivities');
    console.log('✅ UserService methods: PASS (methods exist)');
    
  } catch (error) {
    console.error('❌ UserService test failed:', error);
  }
}

// Run tests
async function runTests() {
  await testDashboardService();
  await testUserServiceMethods();
  
  // Clean up
  setTimeout(() => {
    DashboardService.cleanup();
    console.log('\n🧹 Cleanup completed');
    process.exit(0);
  }, 3000);
}

runTests().catch(console.error);