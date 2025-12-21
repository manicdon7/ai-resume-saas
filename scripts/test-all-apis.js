#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all API endpoints to ensure they're working correctly
 */

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 2,
  verbose: true
};

// Test user data
const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = null;

/**
 * HTTP request helper with timeout and retries
 */
async function makeRequest(url, options = {}, retries = TEST_CONFIG.retries) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && (error.name === 'AbortError' || error.code === 'ECONNREFUSED')) {
      console.log(`  ⏳ Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return makeRequest(url, options, retries - 1);
    }
    
    throw error;
  }
}

/**
 * Test result logger
 */
function logTest(name, success, details = '') {
  const icon = success ? '✅' : '❌';
  const status = success ? 'PASS' : 'FAIL';
  console.log(`${icon} ${name}: ${status}${details ? ` - ${details}` : ''}`);
}

/**
 * Test health endpoint
 */
async function testHealth() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    const success = response.ok && data.status === 'healthy';
    logTest('Health Check', success, `Status: ${data.status}`);
    
    if (TEST_CONFIG.verbose && data.services) {
      console.log('  📊 Services:', Object.entries(data.services).map(([k, v]) => `${k}: ${v.status}`).join(', '));
    }
    
    return success;
  } catch (error) {
    logTest('Health Check', false, error.message);
    return false;
  }
}

/**
 * Test user registration
 */
async function testRegister() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });
    
    const data = await response.json();
    const success = response.ok && data.success && data.data?.token;
    
    if (success) {
      authToken = data.data.token;
    }
    
    logTest('User Registration', success, success ? 'Token received' : data.error?.message || 'Failed');
    return success;
  } catch (error) {
    logTest('User Registration', false, error.message);
    return false;
  }
}

/**
 * Test user login
 */
async function testLogin() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });
    
    const data = await response.json();
    const success = response.ok && data.success && data.data?.token;
    
    if (success && !authToken) {
      authToken = data.data.token;
    }
    
    logTest('User Login', success, success ? 'Token received' : data.error?.message || 'Failed');
    return success;
  } catch (error) {
    logTest('User Login', false, error.message);
    return false;
  }
}

/**
 * Test credits validation endpoint
 */
async function testCreditsValidation() {
  if (!authToken) {
    logTest('Credits Validation', false, 'No auth token');
    return false;
  }

  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        action: 'test_action',
        requiredCredits: 1
      })
    });
    
    const data = await response.json();
    const success = response.ok && data.success;
    
    logTest('Credits Validation', success, success ? `Has credits: ${data.hasCredits}` : data.error?.message || 'Failed');
    return success;
  } catch (error) {
    logTest('Credits Validation', false, error.message);
    return false;
  }
}

/**
 * Test user credits endpoint
 */
async function testUserCredits() {
  if (!authToken) {
    logTest('User Credits', false, 'No auth token');
    return false;
  }

  try {
    const response = await makeRequest(`${BASE_URL}/api/user/credits`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const success = response.ok && data.success;
    
    logTest('User Credits', success, success ? `Credits: ${data.data.credits}` : data.error?.message || 'Failed');
    return success;
  } catch (error) {
    logTest('User Credits', false, error.message);
    return false;
  }
}

/**
 * Test dashboard endpoint
 */
async function testDashboard() {
  if (!authToken) {
    logTest('Dashboard', false, 'No auth token');
    return false;
  }

  try {
    const response = await makeRequest(`${BASE_URL}/api/user/dashboard`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const success = response.ok && data.success;
    
    logTest('Dashboard', success, success ? 'Data received' : data.error?.message || 'Failed');
    return success;
  } catch (error) {
    logTest('Dashboard', false, error.message);
    return false;
  }
}

/**
 * Test job search endpoint
 */
async function testJobSearch() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/jobs/search`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'software engineer',
        page: 1,
        limit: 5
      })
    });
    
    const data = await response.json();
    const success = response.ok && data.success;
    
    logTest('Job Search', success, success ? `Found ${data.data?.jobs?.length || 0} jobs` : data.error?.message || 'Failed');
    return success;
  } catch (error) {
    logTest('Job Search', false, error.message);
    return false;
  }
}

/**
 * Test text extraction endpoint
 */
async function testTextExtraction() {
  try {
    // Create a simple text file for testing
    const testText = 'John Doe\njohn.doe@example.com\n(555) 123-4567\nSoftware Engineer with 5 years of experience in JavaScript and React.';
    const blob = new Blob([testText], { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', blob, 'test-resume.txt');
    
    const response = await makeRequest(`${BASE_URL}/api/extract-text`, {
      method: 'POST',
      body: formData,
      headers: {} // Don't set Content-Type for FormData
    });
    
    const data = await response.json();
    const success = response.ok && data.success;
    
    logTest('Text Extraction', success, success ? 'Text extracted' : data.error?.message || 'Failed');
    return success;
  } catch (error) {
    logTest('Text Extraction', false, error.message);
    return false;
  }
}

/**
 * Test credit consumption endpoint
 */
async function testCreditConsumption() {
  if (!authToken) {
    logTest('Credit Consumption', false, 'No auth token');
    return false;
  }

  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/consume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        action: 'test_action',
        amount: 1
      })
    });
    
    const data = await response.json();
    const success = response.ok && data.success;
    
    logTest('Credit Consumption', success, success ? `Consumed: ${data.consumed}` : data.error?.message || 'Failed');
    return success;
  } catch (error) {
    logTest('Credit Consumption', false, error.message);
    return false;
  }
}

/**
 * Test credit history endpoint
 */
async function testCreditHistory() {
  if (!authToken) {
    logTest('Credit History', false, 'No auth token');
    return false;
  }

  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/history?limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const success = response.ok && data.success;
    
    logTest('Credit History', success, success ? `Transactions: ${data.data?.transactions?.length || 0}` : data.error?.message || 'Failed');
    return success;
  } catch (error) {
    logTest('Credit History', false, error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log(`🔄 Retries: ${TEST_CONFIG.retries}\n`);

  const tests = [
    { name: 'Health Check', fn: testHealth, critical: true },
    { name: 'User Registration', fn: testRegister, critical: false },
    { name: 'User Login', fn: testLogin, critical: false },
    { name: 'Credits Validation', fn: testCreditsValidation, critical: false },
    { name: 'User Credits', fn: testUserCredits, critical: false },
    { name: 'Dashboard', fn: testDashboard, critical: false },
    { name: 'Job Search', fn: testJobSearch, critical: false },
    { name: 'Text Extraction', fn: testTextExtraction, critical: false },
    { name: 'Credit Consumption', fn: testCreditConsumption, critical: false },
    { name: 'Credit History', fn: testCreditHistory, critical: false }
  ];

  const results = [];
  let criticalFailures = 0;

  console.log('📋 Running Tests:\n');

  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push({ ...test, success });
      
      if (!success && test.critical) {
        criticalFailures++;
      }
    } catch (error) {
      console.error(`💥 Unexpected error in ${test.name}:`, error.message);
      results.push({ ...test, success: false, error: error.message });
      
      if (test.critical) {
        criticalFailures++;
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`🚨 Critical Failures: ${criticalFailures}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(test => {
      console.log(`  - ${test.name}${test.error ? `: ${test.error}` : ''}`);
    });
  }

  console.log('\n' + '='.repeat(50));

  if (criticalFailures > 0) {
    console.log('🚨 CRITICAL FAILURES DETECTED - Application may not be ready for production');
    process.exit(1);
  } else if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED - Application is ready!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed but no critical issues - Application is mostly functional');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Tests interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});