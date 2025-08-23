import admin from 'firebase-admin';

// Mock Firebase Admin for development when credentials aren't available
let auth, db;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  // Production configuration
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
  db = admin.firestore();
} else {
  // Mock implementation for development
  console.warn('Using mock Firebase Admin for development');
  
  auth = {
    verifyIdToken: async (token) => {
      // In development, accept any token
      return { uid: 'dev-user-id', email: 'dev@example.com' };
    }
  };
  
  db = {
    collection: () => ({
      doc: () => ({
        set: async () => {},
        get: async () => ({ exists: true, data: () => ({}) }),
      }),
      where: () => ({
        get: async () => ({ docs: [], forEach: () => {} }),
      }),
    }),
    doc: () => ({
      set: async () => {},
      get: async () => ({ exists: true, data: () => ({}) }),
    }),
  };
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

export { auth, db };
export default admin;