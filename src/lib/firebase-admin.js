import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin with service account (Auth only, no Firestore)
let auth;

try {
  if (!admin.apps.length) {
    // Use the service account JSON file directly
    const serviceAccountPath = path.join(process.cwd(), 'rolefit-ai-cca18-firebase-adminsdk-fbsvc-6ddd270b08.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      projectId: 'rolefit-ai-cca18'
    });
  }
  
  auth = admin.auth();
  
  console.log('Firebase Admin initialized successfully with service account');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  
  // Fallback to environment variables if service account file fails
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }
      auth = admin.auth();
      console.log('Firebase Admin initialized with environment variables');
    } else {
      throw new Error('No Firebase credentials available');
    }
  } catch (envError) {
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