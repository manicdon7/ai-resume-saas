#!/usr/bin/env node

/**
 * Test Firebase Authentication with Credit System
 */

const BASE_URL = 'http://localhost:3000';

async function testFirebaseAuth() {
  console.log('🔥 Testing Firebase Authentication with Credit System...\n');

  // Test 1: Check if Firebase mock auth works
  console.log('1. Testing Firebase mock authentication...');
  try {
    const response = await fetch(`${BASE_URL}/api/user/credits`, {
      headers: {
        'Authorization': 'Bearer firebase-mock-token-12345'
      }
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Firebase auth working - User credits retrieved');
    } else {
      console.log('❌ Firebase auth failed:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Test extract-text with Firebase token
  console.log('2. Testing extract-text with Firebase token...');
  try {
    const testContent = 'John Doe\nSoftware Engineer\njohn@example.com\n(555) 123-4567\n\nExperience:\n- 5 years of JavaScript development\n- React, Node.js, MongoDB';
    
    const formData = new FormData();
    const blob = new Blob([testContent], { type: 'text/plain' });
    formData.append('file', blob, 'test-resume.txt');

    const response = await fetch(`${BASE_URL}/api/extract-text`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer firebase-mock-token-12345'
      },
      body: formData
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Extract-text working with Firebase auth');
    } else {
      console.log('❌ Extract-text failed:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Check user data in database
  console.log('3. Checking user data in database...');
  try {
    const { getDatabase } = await import('../lib/mongodb.js');
    const db = await getDatabase();
    const users = db.collection('users');
    
    // Look for users created by Firebase auth
    const firebaseUsers = await users.find({
      $or: [
        { firebaseUid: { $exists: true } },
        { _id: { $regex: /^[a-zA-Z0-9-_]+$/ } } // Firebase UID pattern
      ]
    }).toArray();

    console.log(`Found ${firebaseUsers.length} Firebase users in database:`);
    firebaseUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        credits: user.credits,
        isPro: user.isPro,
        createdAt: user.createdAt
      });
    });

    // Check credit transactions
    const transactions = db.collection('credit_transactions');
    const recentTransactions = await transactions.find({}).sort({ timestamp: -1 }).limit(5).toArray();
    
    console.log(`\nRecent ${recentTransactions.length} credit transactions:`);
    recentTransactions.forEach((tx, index) => {
      console.log(`Transaction ${index + 1}:`, {
        userId: tx.userId,
        type: tx.type,
        amount: tx.amount,
        action: tx.action,
        timestamp: tx.timestamp
      });
    });

  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
}

// Run the test
testFirebaseAuth().catch(console.error);