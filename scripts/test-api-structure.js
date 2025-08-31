/**
 * Test script to verify API structure and imports
 */

import fs from 'fs';
import path from 'path';

function testDashboardRoute() {
  console.log('🧪 Testing Dashboard API Route Structure\n');
  
  const routePath = path.resolve('./src/app/api/user/dashboard/route.js');
  
  if (!fs.existsSync(routePath)) {
    console.log('❌ Dashboard route file not found');
    return false;
  }
  
  console.log('✅ Dashboard route file exists');
  
  const content = fs.readFileSync(routePath, 'utf8');
  
  // Check imports
  const checks = [
    {
      test: content.includes("from '../../../../lib/firebase-admin'"),
      message: 'Firebase admin import path'
    },
    {
      test: content.includes("from '../../../../lib/user-service'"),
      message: 'UserService import path'
    },
    {
      test: content.includes('getUserDashboardStats'),
      message: 'Uses getUserDashboardStats method'
    },
    {
      test: content.includes('getResumeData'),
      message: 'Uses getResumeData method'
    },
    {
      test: content.includes('auth.verifyIdToken'),
      message: 'Uses Firebase auth verification'
    },
    {
      test: content.includes('NextResponse.json'),
      message: 'Returns proper JSON response'
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.message}`);
    } else {
      console.log(`❌ ${check.message}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testUserServiceStructure() {
  console.log('\n🧪 Testing UserService Structure\n');
  
  const servicePath = path.resolve('./src/lib/user-service.js');
  
  if (!fs.existsSync(servicePath)) {
    console.log('❌ UserService file not found');
    return false;
  }
  
  console.log('✅ UserService file exists');
  
  const content = fs.readFileSync(servicePath, 'utf8');
  
  const checks = [
    {
      test: content.includes("from '../../lib/mongodb.js'"),
      message: 'MongoDB import path'
    },
    {
      test: content.includes("from './firebase-admin.js'"),
      message: 'Firebase admin import path'
    },
    {
      test: content.includes('getUserDashboardStats'),
      message: 'Has getUserDashboardStats method'
    },
    {
      test: content.includes('getResumeData'),
      message: 'Has getResumeData method'
    },
    {
      test: content.includes('class UserService'),
      message: 'Exports UserService class'
    },
    {
      test: content.includes('static async getUserDashboardStats'),
      message: 'getUserDashboardStats is static async'
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.message}`);
    } else {
      console.log(`❌ ${check.message}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testFirebaseAdminStructure() {
  console.log('\n🧪 Testing Firebase Admin Structure\n');
  
  const adminPath = path.resolve('./src/lib/firebase-admin.js');
  
  if (!fs.existsSync(adminPath)) {
    console.log('❌ Firebase admin file not found');
    return false;
  }
  
  console.log('✅ Firebase admin file exists');
  
  const content = fs.readFileSync(adminPath, 'utf8');
  
  const checks = [
    {
      test: content.includes('export { auth'),
      message: 'Exports auth object'
    },
    {
      test: content.includes('verifyIdToken'),
      message: 'Has verifyIdToken function'
    },
    {
      test: content.includes('admin.auth()'),
      message: 'Initializes Firebase auth'
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.message}`);
    } else {
      console.log(`❌ ${check.message}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function testMongoDBStructure() {
  console.log('\n🧪 Testing MongoDB Structure\n');
  
  const mongoPath = path.resolve('./lib/mongodb.js');
  
  if (!fs.existsSync(mongoPath)) {
    console.log('❌ MongoDB file not found');
    return false;
  }
  
  console.log('✅ MongoDB file exists');
  
  const content = fs.readFileSync(mongoPath, 'utf8');
  
  const checks = [
    {
      test: content.includes('MongoClient'),
      message: 'Imports MongoClient'
    },
    {
      test: content.includes('export default clientPromise'),
      message: 'Exports clientPromise'
    },
    {
      test: content.includes('process.env.MONGODB_URI'),
      message: 'Uses MONGODB_URI environment variable'
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.message}`);
    } else {
      console.log(`❌ ${check.message}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running API Structure Tests\n');
  
  const results = [
    testDashboardRoute(),
    testUserServiceStructure(),
    testFirebaseAdminStructure(),
    testMongoDBStructure()
  ];
  
  const allPassed = results.every(result => result);
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All tests passed! The dashboard API should work correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the issues above.');
  }
  
  console.log('='.repeat(50));
}

runAllTests();