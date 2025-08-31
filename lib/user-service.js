import clientPromise from './mongodb';

export class UserService {
  static async createOrUpdateUser(firebaseUser, preferences = {}) {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      const users = db.collection('users');

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        emailVerified: firebaseUser.emailVerified || false,
        credits: 3, // Default credits for new users
        isPro: false,
        acceptedTerms: preferences.acceptedTerms || false,
        isNotificationOn: preferences.isNotificationOn !== undefined ? preferences.isNotificationOn : true,
        emailPreferences: preferences.emailPreferences || {
          welcomeEmails: true,
          resumeUpdates: true,
          jobMatches: true,
          weeklyDigest: true,
          applicationReminders: true,
          marketingEmails: false
        },
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingUser = await users.findOne({ uid: firebaseUser.uid });
      
      if (existingUser) {
        // Update existing user
        await users.updateOne(
          { uid: firebaseUser.uid },
          { 
            $set: {
              ...userData,
              credits: existingUser.credits, // Preserve existing credits
              isPro: existingUser.isPro, // Preserve pro status
              createdAt: existingUser.createdAt // Preserve creation date
            }
          }
        );
        return { ...existingUser, ...userData };
      } else {
        // Create new user
        userData.createdAt = new Date().toISOString();
        await users.insertOne(userData);
        return userData;
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  static async getUserById(uid) {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      const users = db.collection('users');

      return await users.findOne({ uid });
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  static async updateUserCredits(uid, credits) {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      const users = db.collection('users');

      await users.updateOne(
        { uid },
        { 
          $set: { 
            credits,
            updatedAt: new Date().toISOString()
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error updating user credits:', error);
      throw error;
    }
  }

  static async getUserStats(uid) {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      
      // Get user data
      const user = await db.collection('users').findOne({ uid });
      
      // Get resume count
      const resumeCount = await db.collection('resumes').countDocuments({ userId: uid });
      
      // Get application count
      const applicationCount = await db.collection('applications').countDocuments({ userId: uid });
      
      // Get recent activity
      const recentActivity = await db.collection('user_activity')
        .find({ userId: uid })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      return {
        user,
        stats: {
          resumesCreated: resumeCount,
          applicationsSubmitted: applicationCount,
          credits: user?.credits || 0,
          isPro: user?.isPro || false
        },
        recentActivity: recentActivity.map(activity => ({
          type: activity.type,
          description: activity.description,
          timestamp: this.formatTimestamp(activity.timestamp),
          date: activity.timestamp
        }))
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  static async addUserActivity(uid, type, description, metadata = {}) {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      
      const activity = {
        userId: uid,
        type,
        description,
        metadata,
        timestamp: new Date().toISOString()
      };

      await db.collection('user_activity').insertOne(activity);
      return activity;
    } catch (error) {
      console.error('Error adding user activity:', error);
      throw error;
    }
  }

  static async saveResumeData(uid, resumeData) {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      
      const resume = {
        userId: uid,
        ...resumeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingResume = await db.collection('resumes').findOne({ userId: uid });
      
      if (existingResume) {
        await db.collection('resumes').updateOne(
          { userId: uid },
          { $set: { ...resume, createdAt: existingResume.createdAt } }
        );
      } else {
        await db.collection('resumes').insertOne(resume);
      }

      // Add activity
      await this.addUserActivity(uid, 'resume_upload', 'Resume uploaded and processed');
      
      return resume;
    } catch (error) {
      console.error('Error saving resume data:', error);
      throw error;
    }
  }

  static async getResumeData(uid) {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      
      return await db.collection('resumes').findOne({ userId: uid });
    } catch (error) {
      console.error('Error getting resume data:', error);
      throw error;
    }
  }

  static async deleteResumeData(uid) {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      
      await db.collection('resumes').deleteOne({ userId: uid });
      
      // Add activity
      await this.addUserActivity(uid, 'resume_delete', 'Resume removed');
      
      return true;
    } catch (error) {
      console.error('Error deleting resume data:', error);
      throw error;
    }
  }

  static validateUserData(userData) {
    const errors = [];
    
    if (!userData.uid) errors.push('User ID is required');
    if (!userData.email) errors.push('Email is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userData.email && !emailRegex.test(userData.email)) {
      errors.push('Invalid email format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static formatTimestamp(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  }
}