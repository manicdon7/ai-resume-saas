import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin with service account (Auth only, no Firestore)
let auth;

try {
  if (!admin.apps.length) {
    // Debug environment variables
    console.log('Firebase env check:', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    // Use environment variables for Firebase Admin SDK
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      
      auth = admin.auth();
      console.log('Firebase Admin initialized with environment variables');
    } else {
      console.warn('Missing Firebase environment variables:', {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'missing',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'missing',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'present' : 'missing'
      });
      throw new Error('Firebase environment variables not found');
    }
  } else {
    auth = admin.auth();
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  console.warn('Using mock Firebase Admin for development');
  
  // Mock implementation for development
  auth = {
    verifyIdToken: async (token) => {
      return { uid: 'dev-user-id', email: 'dev@example.com' };
    },
    createUser: async (userData) => {
      return { uid: 'dev-user-id', ...userData };
    },
    updateUser: async (uid, userData) => {
      return { uid, ...userData };
    },
    deleteUser: async (uid) => {
      return { uid };
    },
    listUsers: async () => {
      return { users: [] };
    }
  };
  
  // No Firestore mock needed - using MongoDB only
}

// Utility function to verify ID tokens
export async function verifyIdToken(token) {
  try {
    if (auth && auth.verifyIdToken) {
      return await auth.verifyIdToken(token);
    }
    // Mock verification for development
    return { uid: 'dev-user-id', email: 'dev@example.com' };
  } catch (error) {
    console.warn('Token verification failed, using mock user');
    return { uid: 'dev-user-id', email: 'dev@example.com' };
  }
}

export { auth };
export default admin;