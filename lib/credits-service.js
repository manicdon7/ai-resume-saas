import { auth } from './firebase-admin';
import { UserService } from './user-service';
import clientPromise from './mongodb';

export class CreditsService {
  static async getUserCredits(authHeader) {
    try {
      if (!authHeader?.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid authorization header', statusCode: 401 };
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      
      const user = await UserService.getUserById(decodedToken.uid);
      
      if (!user) {
        // Create user with default credits if not found
        const newUser = await UserService.createOrUpdateUser({
          uid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
          emailVerified: decodedToken.email_verified
        });
        
        return {
          success: true,
          credits: newUser.credits,
          isPro: newUser.isPro
        };
      }

      return {
        success: true,
        credits: user.isPro ? 'unlimited' : user.credits,
        isPro: user.isPro
      };
    } catch (error) {
      console.error('Credits service error:', error);
      return { success: false, error: 'Failed to get user credits', statusCode: 500 };
    }
  }

  static async consumeCredit(authHeader, action = 'general') {
    try {
      if (!authHeader?.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid authorization header', statusCode: 401 };
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      
      const user = await UserService.getUserById(decodedToken.uid);
      
      if (!user) {
        return { success: false, error: 'User not found', statusCode: 404 };
      }

      // Pro users have unlimited credits
      if (user.isPro) {
        await UserService.addUserActivity(user.uid, 'credit_used', `Used credit for ${action} (Pro user)`);
        return {
          success: true,
          creditsRemaining: 'unlimited',
          isPro: true
        };
      }

      // Check if user has credits
      if (user.credits <= 0) {
        return { success: false, error: 'Insufficient credits', statusCode: 402 };
      }

      // Consume credit
      const newCredits = user.credits - 1;
      await UserService.updateUserCredits(user.uid, newCredits);
      await UserService.addUserActivity(user.uid, 'credit_used', `Used credit for ${action}. ${newCredits} remaining`);
      
      // Add credit transaction record
      await this.addCreditTransaction(
        user.uid,
        'consume',
        action,
        1,
        {
          creditsRemaining: newCredits,
          isPro: false,
          userAgent: 'unknown' // Could be passed from request headers
        }
      );

      return {
        success: true,
        creditsRemaining: newCredits,
        isPro: false
      };
    } catch (error) {
      console.error('Consume credit error:', error);
      return { success: false, error: 'Failed to consume credit', statusCode: 500 };
    }
  }

  static async getCreditTransactionHistory(authHeader, options = {}) {
    try {
      if (!authHeader?.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid authorization header', statusCode: 401 };
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      
      const { limit = 20, skip = 0, type = null } = options;
      
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      
      // Build query
      const query = { userId: decodedToken.uid };
      if (type) {
        query.type = type;
      }
      
      // Get transactions with pagination
      const transactions = await db.collection('credit_transactions')
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      // Get total count for pagination
      const total = await db.collection('credit_transactions').countDocuments(query);
      
      // Format transactions
      const formattedTransactions = transactions.map(transaction => ({
        id: transaction._id.toString(),
        type: transaction.type,
        action: transaction.action,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        metadata: transaction.metadata || {}
      }));
      
      return {
        success: true,
        transactions: formattedTransactions,
        total,
        hasMore: total > (skip + limit)
      };
    } catch (error) {
      console.error('Get credit transaction history error:', error);
      return { success: false, error: 'Failed to get credit history', statusCode: 500 };
    }
  }

  static async addCreditTransaction(userId, type, action, amount, metadata = {}) {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      
      const transaction = {
        userId,
        type, // 'consume', 'refill', 'bonus', 'purchase'
        action, // 'resume_parse', 'job_search', 'daily_reset', etc.
        amount,
        timestamp: new Date().toISOString(),
        metadata
      };
      
      const result = await db.collection('credit_transactions').insertOne(transaction);
      
      return {
        success: true,
        transactionId: result.insertedId.toString(),
        transaction: {
          ...transaction,
          id: result.insertedId.toString()
        }
      };
    } catch (error) {
      console.error('Add credit transaction error:', error);
      return { success: false, error: 'Failed to add credit transaction' };
    }
  }

  static async refillDailyCredits() {
    try {
      const client = await clientPromise;
      const db = client.db('rolefit-ai');
      
      // Reset credits for non-pro users to 3 (daily limit)
      const result = await db.collection('users').updateMany(
        { isPro: false },
        { 
          $set: { 
            credits: 3,
            updatedAt: new Date().toISOString()
          }
        }
      );

      console.log(`Refilled credits for ${result.modifiedCount} users`);
      return result.modifiedCount;
    } catch (error) {
      console.error('Error refilling daily credits:', error);
      throw error;
    }
  }
}