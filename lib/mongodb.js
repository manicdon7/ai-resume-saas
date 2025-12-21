import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value
  // across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch(error => {
      console.error('MongoDB connection error in development:', error);
      throw error;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch(error => {
    console.error('MongoDB connection error in production:', error);
    throw error;
  });
}

// Add connection event listeners
if (client) {
  client.on('serverOpening', () => {
    console.log('MongoDB connection opening...');
  });

  client.on('serverClosed', () => {
    console.log('MongoDB connection closed');
  });

  client.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });
}

// Helper function to get database with retry logic
export async function getDatabase(dbName = 'roleFitAi', retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await clientPromise;
      return client.db(dbName);
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    return { healthy: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      healthy: false, 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
}

export default clientPromise;