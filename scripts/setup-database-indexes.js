#!/usr/bin/env node

/**
 * Database Indexes Setup Script
 * Creates necessary indexes for optimal query performance
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'roleFitAi';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

/**
 * Index definitions for each collection
 */
const INDEXES = {
  users: [
    // Primary lookup indexes
    { key: { uid: 1 }, options: { unique: true, name: 'uid_unique' } },
    { key: { email: 1 }, options: { unique: true, name: 'email_unique' } },
    
    // Query optimization indexes
    { key: { isPro: 1 }, options: { name: 'isPro_index' } },
    { key: { credits: 1 }, options: { name: 'credits_index' } },
    { key: { lastCreditReset: 1 }, options: { name: 'lastCreditReset_index' } },
    
    // Compound indexes for common queries
    { key: { isPro: 1, credits: 1 }, options: { name: 'pro_credits_compound' } },
    { key: { email: 1, isPro: 1 }, options: { name: 'email_pro_compound' } },
    
    // Timestamp indexes
    { key: { createdAt: 1 }, options: { name: 'createdAt_index' } },
    { key: { updatedAt: 1 }, options: { name: 'updatedAt_index' } },
    { key: { lastLoginAt: -1 }, options: { name: 'lastLoginAt_desc' } },
    
    // TTL index for inactive users (optional - 2 years)
    { 
      key: { lastLoginAt: 1 }, 
      options: { 
        name: 'inactive_users_ttl',
        expireAfterSeconds: 2 * 365 * 24 * 60 * 60, // 2 years
        partialFilterExpression: { isPro: false }
      } 
    }
  ],

  credit_transactions: [
    // Primary lookup indexes
    { key: { userId: 1 }, options: { name: 'userId_index' } },
    { key: { type: 1 }, options: { name: 'type_index' } },
    { key: { action: 1 }, options: { name: 'action_index' } },
    
    // Timestamp indexes for sorting and filtering
    { key: { timestamp: -1 }, options: { name: 'timestamp_desc' } },
    { key: { createdAt: -1 }, options: { name: 'createdAt_desc' } },
    
    // Compound indexes for common queries
    { key: { userId: 1, timestamp: -1 }, options: { name: 'user_timestamp_compound' } },
    { key: { userId: 1, type: 1 }, options: { name: 'user_type_compound' } },
    { key: { userId: 1, action: 1, timestamp: -1 }, options: { name: 'user_action_time_compound' } },
    
    // Analytics indexes
    { key: { type: 1, timestamp: -1 }, options: { name: 'type_timestamp_compound' } },
    { key: { action: 1, timestamp: -1 }, options: { name: 'action_timestamp_compound' } },
    
    // TTL index for old transactions (1 year retention)
    { 
      key: { timestamp: 1 }, 
      options: { 
        name: 'transactions_ttl',
        expireAfterSeconds: 365 * 24 * 60 * 60 // 1 year
      } 
    }
  ],

  resumes: [
    // Primary lookup indexes
    { key: { userId: 1 }, options: { name: 'userId_index' } },
    { key: { uid: 1 }, options: { name: 'uid_index' } },
    
    // Compound indexes
    { key: { userId: 1, createdAt: -1 }, options: { name: 'user_created_compound' } },
    { key: { userId: 1, updatedAt: -1 }, options: { name: 'user_updated_compound' } },
    
    // Status and metadata indexes
    { key: { syncStatus: 1 }, options: { name: 'syncStatus_index' } },
    { key: { version: 1 }, options: { name: 'version_index' } },
    
    // Text search index for resume content
    { 
      key: { 
        'parsedData.name': 'text',
        'parsedData.summary': 'text',
        'parsedData.skills': 'text',
        resumeText: 'text'
      }, 
      options: { 
        name: 'resume_text_search',
        weights: {
          'parsedData.name': 10,
          'parsedData.skills': 5,
          'parsedData.summary': 3,
          resumeText: 1
        }
      } 
    },
    
    // Timestamp indexes
    { key: { createdAt: -1 }, options: { name: 'createdAt_desc' } },
    { key: { updatedAt: -1 }, options: { name: 'updatedAt_desc' } }
  ],

  jobs: [
    // Search and filter indexes
    { key: { title: 1 }, options: { name: 'title_index' } },
    { key: { company: 1 }, options: { name: 'company_index' } },
    { key: { location: 1 }, options: { name: 'location_index' } },
    { key: { type: 1 }, options: { name: 'type_index' } },
    { key: { remote: 1 }, options: { name: 'remote_index' } },
    { key: { experienceLevel: 1 }, options: { name: 'experienceLevel_index' } },
    
    // Compound indexes for common filter combinations
    { key: { location: 1, type: 1 }, options: { name: 'location_type_compound' } },
    { key: { remote: 1, type: 1 }, options: { name: 'remote_type_compound' } },
    { key: { experienceLevel: 1, type: 1 }, options: { name: 'experience_type_compound' } },
    
    // Sorting indexes
    { key: { postedDate: -1 }, options: { name: 'postedDate_desc' } },
    { key: { matchScore: -1 }, options: { name: 'matchScore_desc' } },
    { key: { applicants: 1 }, options: { name: 'applicants_asc' } },
    
    // Text search index
    { 
      key: { 
        title: 'text',
        company: 'text',
        description: 'text',
        skills: 'text'
      }, 
      options: { 
        name: 'jobs_text_search',
        weights: {
          title: 10,
          company: 5,
          skills: 3,
          description: 1
        }
      } 
    },
    
    // Geospatial index for location-based searches (if coordinates are added)
    // { key: { coordinates: '2dsphere' }, options: { name: 'location_geo' } },
    
    // TTL index for old job postings (90 days)
    { 
      key: { postedDate: 1 }, 
      options: { 
        name: 'jobs_ttl',
        expireAfterSeconds: 90 * 24 * 60 * 60 // 90 days
      } 
    }
  ],

  user_activities: [
    // Primary lookup indexes
    { key: { userId: 1 }, options: { name: 'userId_index' } },
    { key: { type: 1 }, options: { name: 'type_index' } },
    
    // Timestamp indexes
    { key: { timestamp: -1 }, options: { name: 'timestamp_desc' } },
    { key: { createdAt: -1 }, options: { name: 'createdAt_desc' } },
    
    // Compound indexes for dashboard queries
    { key: { userId: 1, timestamp: -1 }, options: { name: 'user_timestamp_compound' } },
    { key: { userId: 1, type: 1, timestamp: -1 }, options: { name: 'user_type_time_compound' } },
    
    // TTL index for old activities (6 months retention)
    { 
      key: { timestamp: 1 }, 
      options: { 
        name: 'activities_ttl',
        expireAfterSeconds: 6 * 30 * 24 * 60 * 60 // 6 months
      } 
    }
  ],

  sessions: [
    // Session management indexes
    { key: { sessionId: 1 }, options: { unique: true, name: 'sessionId_unique' } },
    { key: { userId: 1 }, options: { name: 'userId_index' } },
    { key: { expiresAt: 1 }, options: { name: 'expiresAt_index' } },
    
    // TTL index for expired sessions
    { 
      key: { expiresAt: 1 }, 
      options: { 
        name: 'sessions_ttl',
        expireAfterSeconds: 0 // Expire at the specified time
      } 
    }
  ]
};

/**
 * Create indexes for a collection
 */
async function createIndexesForCollection(db, collectionName, indexes) {
  console.log(`\n📊 Creating indexes for ${collectionName}...`);
  
  const collection = db.collection(collectionName);
  
  for (const indexDef of indexes) {
    try {
      const result = await collection.createIndex(indexDef.key, indexDef.options);
      console.log(`  ✅ Created index: ${indexDef.options.name || JSON.stringify(indexDef.key)}`);
    } catch (error) {
      if (error.code === 85) {
        // Index already exists with different options
        console.log(`  ⚠️  Index exists with different options: ${indexDef.options.name}`);
        
        // Optionally drop and recreate
        try {
          await collection.dropIndex(indexDef.options.name);
          const result = await collection.createIndex(indexDef.key, indexDef.options);
          console.log(`  ✅ Recreated index: ${indexDef.options.name}`);
        } catch (recreateError) {
          console.error(`  ❌ Failed to recreate index: ${indexDef.options.name}`, recreateError.message);
        }
      } else if (error.code === 86) {
        // Index already exists
        console.log(`  ℹ️  Index already exists: ${indexDef.options.name || JSON.stringify(indexDef.key)}`);
      } else {
        console.error(`  ❌ Failed to create index: ${indexDef.options.name}`, error.message);
      }
    }
  }
}

/**
 * List existing indexes for a collection
 */
async function listIndexes(db, collectionName) {
  try {
    const collection = db.collection(collectionName);
    const indexes = await collection.listIndexes().toArray();
    
    console.log(`\n📋 Existing indexes for ${collectionName}:`);
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
  } catch (error) {
    console.log(`  ℹ️  Collection ${collectionName} does not exist yet`);
  }
}

/**
 * Get index statistics
 */
async function getIndexStats(db, collectionName) {
  try {
    const collection = db.collection(collectionName);
    const stats = await collection.stats();
    
    console.log(`\n📈 Statistics for ${collectionName}:`);
    console.log(`  - Documents: ${stats.count?.toLocaleString() || 0}`);
    console.log(`  - Data Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Indexes: ${stats.nindexes || 0}`);
  } catch (error) {
    console.log(`  ℹ️  No statistics available for ${collectionName}`);
  }
}

/**
 * Main setup function
 */
async function setupIndexes() {
  let client;
  
  try {
    console.log('🚀 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    console.log(`✅ Connected to database: ${DB_NAME}`);
    
    // List existing indexes first
    console.log('\n' + '='.repeat(50));
    console.log('EXISTING INDEXES');
    console.log('='.repeat(50));
    
    for (const collectionName of Object.keys(INDEXES)) {
      await listIndexes(db, collectionName);
    }
    
    // Create new indexes
    console.log('\n' + '='.repeat(50));
    console.log('CREATING INDEXES');
    console.log('='.repeat(50));
    
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      await createIndexesForCollection(db, collectionName, indexes);
    }
    
    // Show statistics
    console.log('\n' + '='.repeat(50));
    console.log('COLLECTION STATISTICS');
    console.log('='.repeat(50));
    
    for (const collectionName of Object.keys(INDEXES)) {
      await getIndexStats(db, collectionName);
    }
    
    console.log('\n✅ Database indexes setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📝 Database connection closed');
    }
  }
}

/**
 * Drop all indexes (use with caution)
 */
async function dropAllIndexes() {
  let client;
  
  try {
    console.log('🚀 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    console.log(`✅ Connected to database: ${DB_NAME}`);
    
    for (const collectionName of Object.keys(INDEXES)) {
      try {
        const collection = db.collection(collectionName);
        await collection.dropIndexes();
        console.log(`✅ Dropped all indexes for ${collectionName}`);
      } catch (error) {
        console.log(`ℹ️  No indexes to drop for ${collectionName}`);
      }
    }
    
    console.log('\n✅ All indexes dropped successfully!');
    
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'setup':
  case undefined:
    setupIndexes();
    break;
  case 'drop':
    console.log('⚠️  WARNING: This will drop all indexes!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    setTimeout(dropAllIndexes, 5000);
    break;
  default:
    console.log('Usage: node setup-database-indexes.js [setup|drop]');
    console.log('  setup (default): Create database indexes');
    console.log('  drop: Drop all indexes (use with caution)');
    process.exit(1);
}