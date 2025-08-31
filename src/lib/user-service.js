import clientPromise from '../../lib/mongodb.js';
import { auth } from './firebase-admin.js';

/**
 * Comprehensive user service for MongoDB and Firebase integration
 */
export class UserService {
  static async getMongoClient() {
    try {
      const client = await clientPromise;
      return client.db('roleFitAi');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Create or update user in both MongoDB and Firebase
   */
  static async createOrUpdateUser(firebaseUser, additionalData = {}) {
    try {
      const mongoDb = await this.getMongoClient();
      const usersCollection = mongoDb.collection('users');

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        provider: firebaseUser.providerData?.[0]?.providerId || 'email',
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...additionalData
      };

      // Check if user exists in MongoDB
      const existingUser = await usersCollection.findOne({ uid: firebaseUser.uid });
      
      if (existingUser) {
        // Update existing user
        await usersCollection.updateOne(
          { uid: firebaseUser.uid },
          { 
            $set: {
              ...userData,
              createdAt: existingUser.createdAt // Preserve original creation date
            }
          }
        );
      } else {
        // Create new user with default preferences
        const newUserData = {
          ...userData,
          createdAt: new Date().toISOString(),
          isNotificationOn: additionalData.isNotificationOn ?? true,
          acceptedTerms: additionalData.acceptedTerms ?? false,
          termsAcceptedAt: additionalData.acceptedTerms ? new Date().toISOString() : null,
          emailPreferences: additionalData.emailPreferences ?? {
            welcomeEmails: true,
            resumeUpdates: true,
            jobMatches: true,
            weeklyDigest: true,
            applicationReminders: true,
            marketingEmails: false
          },
          credits: 3, // Default free credits
          isPro: false,
          plan: 'free'
        };

        await usersCollection.insertOne(newUserData);
      }

      // MongoDB only - no Firestore needed

      return await this.getUserById(firebaseUser.uid);
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID from MongoDB
   */
  static async getUserById(uid) {
    try {
      const mongoDb = await this.getMongoClient();
      const usersCollection = mongoDb.collection('users');
      
      const user = await usersCollection.findOne({ uid });
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email from MongoDB
   */
  static async getUserByEmail(email) {
    try {
      const mongoDb = await this.getMongoClient();
      const usersCollection = mongoDb.collection('users');
      
      const user = await usersCollection.findOne({ email });
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(uid, preferences) {
    try {
      const mongoDb = await this.getMongoClient();
      const usersCollection = mongoDb.collection('users');

      const updateData = {
        ...preferences,
        updatedAt: new Date().toISOString()
      };

      if (preferences.acceptedTerms) {
        updateData.termsAcceptedAt = new Date().toISOString();
      }

      await usersCollection.updateOne(
        { uid },
        { $set: updateData }
      );

      // MongoDB only - no Firestore needed

      return await this.getUserById(uid);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user credits
   */
  static async updateUserCredits(uid, credits) {
    try {
      const mongoDb = await this.getMongoClient();
      const usersCollection = mongoDb.collection('users');

      await usersCollection.updateOne(
        { uid },
        { 
          $set: { 
            credits,
            updatedAt: new Date().toISOString()
          }
        }
      );

      return await this.getUserById(uid);
    } catch (error) {
      console.error('Error updating user credits:', error);
      throw error;
    }
  }

  /**
   * Get individual user dashboard statistics
   */
  static async getUserDashboardStats(uid) {
    try {
      const mongoDb = await this.getMongoClient();
      const usersCollection = mongoDb.collection('users');
      const activitiesCollection = mongoDb.collection('activities');
      const resumesCollection = mongoDb.collection('resumes');

      // Get user data
      const user = await usersCollection.findOne({ uid });
      if (!user) {
        throw new Error('User not found');
      }

      // Get activity counts
      const [
        resumesCreated,
        applicationsSent,
        jobSearches,
        totalActivities,
        recentActivity
      ] = await Promise.all([
        activitiesCollection.countDocuments({ 
          userId: uid, 
          type: 'resume_upload' 
        }),
        activitiesCollection.countDocuments({ 
          userId: uid, 
          type: 'job_application' 
        }),
        activitiesCollection.countDocuments({ 
          userId: uid, 
          type: 'job_search' 
        }),
        activitiesCollection.countDocuments({ userId: uid }),
        activitiesCollection.find({ userId: uid })
          .sort({ timestamp: -1 })
          .limit(10)
          .toArray()
      ]);

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          credits: user.credits || 0,
          isPro: user.isPro || false,
          lastLoginAt: user.lastLoginAt
        },
        stats: {
          creditsRemaining: user.credits || 0,
          resumesCreated,
          applicationsSent,
          jobSearches,
          totalActivities,
          lastActivityAt: recentActivity.length > 0 ? recentActivity[0].timestamp : null
        },
        recentActivity: recentActivity.map(activity => ({
          id: activity._id.toString(),
          type: activity.type,
          description: activity.description,
          metadata: activity.metadata || {},
          timestamp: activity.timestamp
        }))
      };
    } catch (error) {
      console.error('Error getting user dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get user resume data
   */
  static async getResumeData(uid) {
    try {
      const mongoDb = await this.getMongoClient();
      const resumesCollection = mongoDb.collection('resumes');
      
      const resume = await resumesCollection.findOne({ userId: uid });
      return resume;
    } catch (error) {
      console.error('Error getting resume data:', error);
      throw error;
    }
  }

  /**
   * Add user activity
   */
  static async addUserActivity(userId, type, description, metadata = {}) {
    try {
      const mongoDb = await this.getMongoClient();
      const activitiesCollection = mongoDb.collection('activities');

      const activity = {
        userId,
        type,
        description,
        metadata,
        timestamp: new Date().toISOString()
      };

      const result = await activitiesCollection.insertOne(activity);
      
      // Update user's last activity timestamp
      const usersCollection = mongoDb.collection('users');
      await usersCollection.updateOne(
        { uid: userId },
        { 
          $set: { 
            lastActivityAt: activity.timestamp,
            updatedAt: new Date().toISOString()
          }
        }
      );

      return {
        ...activity,
        id: result.insertedId.toString()
      };
    } catch (error) {
      console.error('Error adding user activity:', error);
      throw error;
    }
  }

  /**
   * Get user activities with pagination
   */
  static async getUserActivities(uid, options = {}) {
    try {
      const { limit = 20, skip = 0, type = null } = options;
      
      const mongoDb = await this.getMongoClient();
      const activitiesCollection = mongoDb.collection('activities');

      const query = { userId: uid };
      if (type) {
        query.type = type;
      }

      const activities = await activitiesCollection
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return activities.map(activity => ({
        id: activity._id.toString(),
        userId: activity.userId,
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata || {},
        timestamp: activity.timestamp
      }));
    } catch (error) {
      console.error('Error getting user activities:', error);
      throw error;
    }
  }

  /**
   * Get user statistics for admin dashboard
   */
  static async getUserStats(days = 30) {
    try {
      const mongoDb = await this.getMongoClient();
      const usersCollection = mongoDb.collection('users');

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const [
        totalUsers,
        newUsers,
        activeUsers,
        usersWithNotifications,
        usersWithTermsAccepted
      ] = await Promise.all([
        usersCollection.countDocuments(),
        usersCollection.countDocuments({
          createdAt: { $gte: startDate.toISOString() }
        }),
        usersCollection.countDocuments({
          lastLoginAt: { $gte: startDate.toISOString() }
        }),
        usersCollection.countDocuments({ isNotificationOn: true }),
        usersCollection.countDocuments({ acceptedTerms: true })
      ]);

      return {
        totalUsers,
        newUsers,
        activeUsers,
        usersWithNotifications,
        usersWithTermsAccepted,
        period: `${days} days`
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Delete user from both MongoDB and Firebase
   */
  static async deleteUser(uid) {
    try {
      const mongoDb = await this.getMongoClient();
      const usersCollection = mongoDb.collection('users');

      // Delete from MongoDB
      await usersCollection.deleteOne({ uid });

      // MongoDB only - no Firestore needed

      // Delete from Firebase Auth
      try {
        await auth.deleteUser(uid);
      } catch (authError) {
        console.error('Firebase Auth deletion error:', authError);
      }

      return { success: true, uid };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Validate user data for ethical compliance
   */
  static validateUserData(userData) {
    const errors = [];

    // Required fields
    if (!userData.email) {
      errors.push('Email is required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userData.email && !emailRegex.test(userData.email)) {
      errors.push('Invalid email format');
    }

    // Terms acceptance validation
    if (userData.acceptedTerms === undefined) {
      errors.push('Terms acceptance status is required');
    }

    // Privacy compliance - ensure we only store necessary data
    const allowedFields = [
      'uid', 'email', 'displayName', 'photoURL', 'emailVerified', 'provider',
      'isNotificationOn', 'acceptedTerms', 'emailPreferences', 'credits', 'isPro', 'plan',
      'createdAt', 'updatedAt', 'lastLoginAt', 'termsAcceptedAt'
    ];

    const extraFields = Object.keys(userData).filter(field => !allowedFields.includes(field));
    if (extraFields.length > 0) {
      errors.push(`Unauthorized data fields: ${extraFields.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
