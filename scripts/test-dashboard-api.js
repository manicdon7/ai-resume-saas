/**
 * Test script for dashboard API
 */

// Test the UserService methods directly
async function testUserService() {
  try {
    console.log('Testing UserService methods...');
    
    // Import the UserService
    const { UserService } = await import('../src/lib/user-service.js');
    
    console.log('✅ UserService imported successfully');
    
    // Check if getUserDashboardStats method exists
    if (typeof UserService.getUserDashboardStats === 'function') {
      console.log('✅ getUserDashboardStats method exists');
    } else {
      console.log('❌ getUserDashboardStats method not found');
      console.log('Available methods:', Object.getOwnPropertyNames(UserService).filter(name => typeof UserService[name] === 'function'));
    }
    
    // Check if getResumeData method exists
    if (typeof UserService.getResumeData === 'function') {
      console.log('✅ getResumeData method exists');
    } else {
      console.log('❌ getResumeData method not found');
    }
    
    console.log('\nUserService test completed');
    
  } catch (error) {
    console.error('❌ Error testing UserService:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test the dashboard API route structure
async function testDashboardRoute() {
  try {
    console.log('\nTesting dashboard route structure...');
    
    // Check if the route file exists and can be imported
    const fs = await import('fs');
    const path = await import('path');
    
    const routePath = path.resolve('./src/app/api/user/dashboard/route.js');
    
    if (fs.existsSync(routePath)) {
      console.log('✅ Dashboard route file exists');
      
      // Read the file content to check imports
      const content = fs.readFileSync(routePath, 'utf8');
      
      if (content.includes("from '../../../../lib/firebase-admin'")) {
        console.log('✅ Firebase admin import path is correct');
      } else {
        console.log('❌ Firebase admin import path issue');
      }
      
      if (content.includes("from '../../../../lib/user-service'")) {
        console.log('✅ UserService import path is correct');
      } else {
        console.log('❌ UserService import path issue');
      }
      
      if (content.includes('getUserDashboardStats')) {
        console.log('✅ Uses getUserDashboardStats method');
      } else {
        console.log('❌ Does not use getUserDashboardStats method');
      }
      
    } else {
      console.log('❌ Dashboard route file not found');
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard route:', error.message);
  }
}

// Test MongoDB connection
async function testMongoConnection() {
  try {
    console.log('\nTesting MongoDB connection...');
    
    // Import clientPromise
    const clientPromise = await import('../lib/mongodb.js');
    
    console.log('✅ MongoDB module imported successfully');
    
    // Try to get the client (this will test the connection)
    const client = await clientPromise.default;
    const db = client.db('roleFitAi');
    
    console.log('✅ MongoDB connection successful');
    console.log('Database name:', db.databaseName);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Running Dashboard API Tests\n');
  
  await testUserService();
  await testDashboardRoute();
  await testMongoConnection();
  
  console.log('\n✅ All tests completed');
}

runTests().catch(console.error);