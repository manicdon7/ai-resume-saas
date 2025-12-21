#!/usr/bin/env node

/**
 * Check Database for User Data and Transactions
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function checkDatabase() {
  console.log('🔍 Checking Database for User Data and Transactions...\n');

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('roleFitAi');
    const users = db.collection('users');
    const transactions = db.collection('credit_transactions');

    // Check users
    console.log('👥 Users in database:');
    const allUsers = await users.find({}).toArray();
    console.log(`Found ${allUsers.length} users:`);
    
    allUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Firebase UID: ${user.firebaseUid || 'N/A'}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  Name: ${user.name || 'N/A'}`);
      console.log(`  Credits: ${user.credits}`);
      console.log(`  Is Pro: ${user.isPro || false}`);
      console.log(`  Created: ${user.createdAt || 'N/A'}`);
      console.log(`  Last Updated: ${user.updatedAt || 'N/A'}`);
    });

    // Check transactions
    console.log('\n💳 Recent Credit Transactions:');
    const recentTransactions = await transactions.find({}).sort({ timestamp: -1 }).limit(10).toArray();
    console.log(`Found ${recentTransactions.length} recent transactions:`);
    
    recentTransactions.forEach((tx, index) => {
      console.log(`\nTransaction ${index + 1}:`);
      console.log(`  ID: ${tx._id}`);
      console.log(`  User ID: ${tx.userId}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  Amount: ${tx.amount}`);
      console.log(`  Action: ${tx.action}`);
      console.log(`  Timestamp: ${tx.timestamp}`);
      if (tx.metadata) {
        console.log(`  Metadata:`, tx.metadata);
      }
    });

    // Check resume data
    console.log('\n📄 Resume Data:');
    const resumes = db.collection('resumes');
    const allResumes = await resumes.find({}).toArray();
    console.log(`Found ${allResumes.length} resumes in database:`);
    
    allResumes.forEach((resume, index) => {
      console.log(`\nResume ${index + 1}:`);
      console.log(`  ID: ${resume._id}`);
      console.log(`  User ID: ${resume.userId}`);
      console.log(`  File Name: ${resume.fileName || 'N/A'}`);
      console.log(`  File Type: ${resume.fileType || 'N/A'}`);
      console.log(`  File Size: ${resume.fileSize || 'N/A'}`);
      console.log(`  Resume Text Length: ${resume.resumeText ? resume.resumeText.length : 0} characters`);
      console.log(`  Parsed Data: ${resume.parsedData ? 'Yes' : 'No'}`);
      console.log(`  Created: ${resume.createdAt || 'N/A'}`);
      console.log(`  Updated: ${resume.updatedAt || 'N/A'}`);
    });

    console.log('\n✅ Database check completed successfully!');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkDatabase().catch(console.error);