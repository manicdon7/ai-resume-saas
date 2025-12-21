#!/usr/bin/env node

/**
 * Fix Invalid Dates in Database
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

async function fixInvalidDates() {
  console.log('🔧 Fixing Invalid Dates in Database...\n');

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('roleFitAi');
    const userActivity = db.collection('user_activity');

    // Find all user activity records
    console.log('📋 Checking user_activity collection...');
    const activities = await userActivity.find({}).toArray();
    console.log(`Found ${activities.length} activity records`);

    let invalidCount = 0;
    let fixedCount = 0;

    for (const activity of activities) {
      try {
        // Check if timestamp is valid
        if (activity.timestamp) {
          const date = new Date(activity.timestamp);
          if (isNaN(date.getTime())) {
            console.log(`❌ Invalid timestamp found: ${activity.timestamp} (ID: ${activity._id})`);
            invalidCount++;
            
            // Fix by setting to current date or removing the record
            await userActivity.updateOne(
              { _id: activity._id },
              { $set: { timestamp: new Date().toISOString() } }
            );
            fixedCount++;
            console.log(`✅ Fixed timestamp for activity ID: ${activity._id}`);
          }
        } else {
          console.log(`❌ Missing timestamp found (ID: ${activity._id})`);
          invalidCount++;
          
          // Add missing timestamp
          await userActivity.updateOne(
            { _id: activity._id },
            { $set: { timestamp: new Date().toISOString() } }
          );
          fixedCount++;
          console.log(`✅ Added timestamp for activity ID: ${activity._id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing activity ${activity._id}:`, error.message);
      }
    }

    // Check users collection for invalid dates
    console.log('\n📋 Checking users collection...');
    const users = db.collection('users');
    const allUsers = await users.find({}).toArray();
    console.log(`Found ${allUsers.length} user records`);

    for (const user of allUsers) {
      let needsUpdate = false;
      const updates = {};

      // Check createdAt
      if (user.createdAt) {
        const createdDate = new Date(user.createdAt);
        if (isNaN(createdDate.getTime())) {
          console.log(`❌ Invalid createdAt found for user: ${user._id}`);
          updates.createdAt = new Date().toISOString();
          needsUpdate = true;
        }
      }

      // Check updatedAt
      if (user.updatedAt) {
        const updatedDate = new Date(user.updatedAt);
        if (isNaN(updatedDate.getTime())) {
          console.log(`❌ Invalid updatedAt found for user: ${user._id}`);
          updates.updatedAt = new Date().toISOString();
          needsUpdate = true;
        }
      }

      // Check lastLoginAt
      if (user.lastLoginAt) {
        const loginDate = new Date(user.lastLoginAt);
        if (isNaN(loginDate.getTime())) {
          console.log(`❌ Invalid lastLoginAt found for user: ${user._id}`);
          updates.lastLoginAt = new Date().toISOString();
          needsUpdate = true;
        }
      }

      // Check lastCreditReset
      if (user.lastCreditReset) {
        const resetDate = new Date(user.lastCreditReset);
        if (isNaN(resetDate.getTime())) {
          console.log(`❌ Invalid lastCreditReset found for user: ${user._id}`);
          updates.lastCreditReset = new Date();
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await users.updateOne({ _id: user._id }, { $set: updates });
        console.log(`✅ Fixed dates for user: ${user._id}`);
        fixedCount++;
      }
    }

    // Check resumes collection
    console.log('\n📋 Checking resumes collection...');
    const resumes = db.collection('resumes');
    const allResumes = await resumes.find({}).toArray();
    console.log(`Found ${allResumes.length} resume records`);

    for (const resume of allResumes) {
      let needsUpdate = false;
      const updates = {};

      // Check createdAt
      if (resume.createdAt) {
        const createdDate = new Date(resume.createdAt);
        if (isNaN(createdDate.getTime())) {
          console.log(`❌ Invalid createdAt found for resume: ${resume._id}`);
          updates.createdAt = new Date().toISOString();
          needsUpdate = true;
        }
      }

      // Check updatedAt
      if (resume.updatedAt) {
        const updatedDate = new Date(resume.updatedAt);
        if (isNaN(updatedDate.getTime())) {
          console.log(`❌ Invalid updatedAt found for resume: ${resume._id}`);
          updates.updatedAt = new Date().toISOString();
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await resumes.updateOne({ _id: resume._id }, { $set: updates });
        console.log(`✅ Fixed dates for resume: ${resume._id}`);
        fixedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`Total invalid dates found: ${invalidCount}`);
    console.log(`Total records fixed: ${fixedCount}`);
    console.log('\n✅ Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

fixInvalidDates().catch(console.error);