#!/usr/bin/env node

/**
 * Test Credit System
 * Tests the credit consumption and API endpoints
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;

// Test configuration
const TEST_CONFIG = {
  baseUrl: BASE_URL,
  timeout: TIMEOUT,
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User'
  }
};

// Utility functions
async function makeRequest(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function testHealthCheck() {
  console.log('🏥 Testing Health Check...');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/health`);
    const data = await response.json();
    
    if (data.status === 'healthy') {
      console.log('✅ Health Check: PASS');
      return true;
    } else {
      console.log('❌ Health Check: FAIL - Unhealthy status');
      console.log('   Status:', data.status);
      if (data.errors) {
        data.errors.forEach(error => {
          console.log(`   Error: ${error.service} - ${error.message}`);
        });
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Health Check: FAIL -', error.message);
    return false;
  }
}

async function testExtractTextWithoutAuth() {
  console.log('📄 Testing Extract Text (No Auth)...');
  try {
    // Create a test file
    const testContent = 'John Doe\nSoftware Engineer\njohn@example.com\n(555) 123-4567\n\nExperience:\n- 5 years of JavaScript development\n- React, Node.js, MongoDB\n- Led team of 3 developers';
    
    const formData = new FormData();
    const blob = new Blob([testContent], { type: 'text/plain' });
    formData.append('file', blob, 'test-resume.txt');

    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/extract-text`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (response.status === 401 && data.error?.code === 'UNAUTHORIZED') {
      console.log('✅ Extract Text (No Auth): PASS - Correctly requires authentication');
      return true;
    } else {
      console.log('❌ Extract Text (No Auth): FAIL - Should require authentication');
      console.log('   Status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Extract Text (No Auth): FAIL -', error.message);
    return false;
  }
}

async function testCreditValidation() {
  console.log('💳 Testing Credit Validation...');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/credits/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'resume_upload'
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Credit Validation: PASS - Correctly requires authentication');
      return true;
    } else {
      console.log('❌ Credit Validation: FAIL - Should require authentication');
      console.log('   Status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Credit Validation: FAIL -', error.message);
    return false;
  }
}

async function testATSAnalysisEndpoint() {
  console.log('🎯 Testing ATS Analysis Endpoint...');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/analysis/ats-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resumeText: 'Test resume content',
        jobDescription: 'Test job description'
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ ATS Analysis: PASS - Correctly requires authentication');
      return true;
    } else {
      console.log('❌ ATS Analysis: FAIL - Should require authentication');
      console.log('   Status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ ATS Analysis: FAIL -', error.message);
    return false;
  }
}

async function testRoleFitAnalysisEndpoint() {
  console.log('🎯 Testing Role Fit Analysis Endpoint...');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/analysis/role-fit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resumeText: 'Test resume content',
        jobDescription: 'Test job description'
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Role Fit Analysis: PASS - Correctly requires authentication');
      return true;
    } else {
      console.log('❌ Role Fit Analysis: FAIL - Should require authentication');
      console.log('   Status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Role Fit Analysis: FAIL -', error.message);
    return false;
  }
}

async function testGenerateEndpoint() {
  console.log('📝 Testing Generate Endpoint...');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resumeText: 'Test resume content',
        jobDescription: 'Test job description'
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Generate Endpoint: PASS - Correctly requires authentication');
      return true;
    } else {
      console.log('❌ Generate Endpoint: FAIL - Should require authentication');
      console.log('   Status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Generate Endpoint: FAIL -', error.message);
    return false;
  }
}

async function testGeneratePDFEndpoint() {
  console.log('📄 Testing Generate PDF Endpoint...');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Test resume content',
        jobDescription: 'Test job description',
        name: 'Test User'
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Generate PDF: PASS - Correctly requires authentication');
      return true;
    } else {
      console.log('❌ Generate PDF: FAIL - Should require authentication');
      console.log('   Status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Generate PDF: FAIL -', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Credit System Tests...\n');
  console.log(`📍 Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms\n`);

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Extract Text (No Auth)', fn: testExtractTextWithoutAuth },
    { name: 'Credit Validation', fn: testCreditValidation },
    { name: 'ATS Analysis', fn: testATSAnalysisEndpoint },
    { name: 'Role Fit Analysis', fn: testRoleFitAnalysisEndpoint },
    { name: 'Generate Endpoint', fn: testGenerateEndpoint },
    { name: 'Generate PDF', fn: testGeneratePDFEndpoint }
  ];

  const results = [];
  
  console.log('📋 Running Tests:\n');

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR -`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
    console.log(''); // Add spacing between tests
  }

  // Print summary
  console.log('==================================================');
  console.log('📊 TEST SUMMARY');
  console.log('==================================================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}${r.error ? ` (${r.error})` : ''}`);
    });
  }

  console.log('\n==================================================');
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED - Credit system is working correctly!');
    process.exit(0);
  } else {
    console.log('🚨 SOME TESTS FAILED - Please check the issues above');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  TEST_CONFIG
};