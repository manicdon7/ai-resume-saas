import { auth, db } from './firebase-admin';

/**
 * Admin utilities for user management and system operations
 */

// User Management Functions
export class AdminUserManager {
  /**
   * Get user details by UID
   */
  static async getUserById(uid) {
    try {
      const userRecord = await auth.getUser(uid);
      const userDoc = await db.collection('users').doc(uid).get();
      
      return {
        ...userRecord.toJSON(),
        preferences: userDoc.exists ? userDoc.data() : null
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Get user details by email
   */
  static async getUserByEmail(email) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      
      return {
        ...userRecord.toJSON(),
        preferences: userDoc.exists ? userDoc.data() : null
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * List all users with pagination
   */
  static async listUsers(maxResults = 1000, pageToken = null) {
    try {
      const listUsersResult = await auth.listUsers(maxResults, pageToken);
      
      // Get user preferences for each user
      const usersWithPreferences = await Promise.all(
        listUsersResult.users.map(async (userRecord) => {
          try {
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            return {
              ...userRecord.toJSON(),
              preferences: userDoc.exists ? userDoc.data() : null
            };
          } catch (error) {
            return {
              ...userRecord.toJSON(),
              preferences: null
            };
          }
        })
      );

      return {
        users: usersWithPreferences,
        pageToken: listUsersResult.pageToken
      };
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  /**
   * Update user custom claims (for role management)
   */
  static async setUserClaims(uid, claims) {
    try {
      await auth.setCustomUserClaims(uid, claims);
      return { success: true, uid, claims };
    } catch (error) {
      console.error('Error setting user claims:', error);
      throw error;
    }
  }

  /**
   * Disable/Enable user account
   */
  static async updateUserStatus(uid, disabled) {
    try {
      await auth.updateUser(uid, { disabled });
      return { success: true, uid, disabled };
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Delete user account and associated data
   */
  static async deleteUser(uid) {
    try {
      // Delete user data from Firestore
      await db.collection('users').doc(uid).delete();
      
      // Delete user from Authentication
      await auth.deleteUser(uid);
      
      return { success: true, uid };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

// Analytics and Reporting Functions
export class AdminAnalytics {
  /**
   * Get user registration statistics
   */
  static async getUserStats(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const usersSnapshot = await db.collection('users')
        .where('createdAt', '>=', startDate.toISOString())
        .where('createdAt', '<=', endDate.toISOString())
        .get();

      const stats = {
        totalNewUsers: usersSnapshot.size,
        usersWithNotifications: 0,
        usersWithTermsAccepted: 0,
        dailyRegistrations: {}
      };

      usersSnapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.isNotificationOn) {
          stats.usersWithNotifications++;
        }
        
        if (data.acceptedTerms) {
          stats.usersWithTermsAccepted++;
        }

        // Group by day
        if (data.createdAt) {
          const date = new Date(data.createdAt).toDateString();
          stats.dailyRegistrations[date] = (stats.dailyRegistrations[date] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Get email notification statistics
   */
  static async getEmailStats() {
    try {
      const usersSnapshot = await db.collection('users').get();
      
      const stats = {
        totalUsers: usersSnapshot.size,
        notificationsEnabled: 0,
        emailPreferences: {
          welcomeEmails: 0,
          resumeUpdates: 0,
          jobMatches: 0,
          weeklyDigest: 0,
          applicationReminders: 0,
          marketingEmails: 0
        }
      };

      usersSnapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.isNotificationOn) {
          stats.notificationsEnabled++;
        }

        if (data.emailPreferences) {
          Object.keys(stats.emailPreferences).forEach(key => {
            if (data.emailPreferences[key]) {
              stats.emailPreferences[key]++;
            }
          });
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting email stats:', error);
      throw error;
    }
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealth() {
    try {
      const totalUsers = await auth.listUsers(1);
      const activeUsers = await db.collection('users')
        .where('lastLoginAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .get();

      return {
        totalUsers: totalUsers.users.length,
        activeUsersLast7Days: activeUsers.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        totalUsers: 0,
        activeUsersLast7Days: 0,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Utility Functions
export class AdminUtils {
  /**
   * Verify if user has admin privileges
   */
  static async verifyAdminUser(uid) {
    try {
      const userRecord = await auth.getUser(uid);
      const customClaims = userRecord.customClaims || {};
      
      return customClaims.admin === true || customClaims.role === 'admin';
    } catch (error) {
      console.error('Error verifying admin user:', error);
      return false;
    }
  }

  /**
   * Send bulk notifications to users
   */
  static async sendBulkNotification(userIds, emailType, templateData) {
    try {
      const results = [];
      
      for (const uid of userIds) {
        try {
          const userRecord = await auth.getUser(uid);
          const userDoc = await db.collection('users').doc(uid).get();
          
          if (userDoc.exists) {
            const preferences = userDoc.data();
            
            if (preferences.isNotificationOn) {
              // Here you would integrate with your email service
              results.push({
                uid,
                email: userRecord.email,
                status: 'queued'
              });
            } else {
              results.push({
                uid,
                email: userRecord.email,
                status: 'skipped_preferences'
              });
            }
          }
        } catch (error) {
          results.push({
            uid,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  /**
   * Clean up inactive user data
   */
  static async cleanupInactiveUsers(daysInactive = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      const inactiveUsers = await db.collection('users')
        .where('lastLoginAt', '<', cutoffDate.toISOString())
        .get();

      const deletedUsers = [];
      
      for (const doc of inactiveUsers.docs) {
        try {
          await AdminUserManager.deleteUser(doc.id);
          deletedUsers.push(doc.id);
        } catch (error) {
          console.error(`Error deleting inactive user ${doc.id}:`, error);
        }
      }

      return {
        totalInactiveUsers: inactiveUsers.size,
        deletedUsers: deletedUsers.length,
        deletedUserIds: deletedUsers
      };
    } catch (error) {
      console.error('Error cleaning up inactive users:', error);
      throw error;
    }
  }
}

// Export all classes
const adminUtils = {
  AdminUserManager,
  AdminAnalytics,
  AdminUtils
};

export default adminUtils;
