import clientPromise from '../../lib/mongodb';
import jwt from 'jsonwebtoken';

/**
 * Credits Service - Centralized credit management system
 */
export class CreditsService {
  static DAILY_CREDITS = 3;

  /**
   * Authenticate user and get user data
   */
  static async authenticateUser(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('UNAUTHORIZED');
    }

    const token = authHeader.replace('Bearer ', '');
    let userId;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      throw new Error('INVALID_TOKEN');
    }

    const client = await clientPromise;
    const db = client.db('roleFitAi');
    const users = db.collection('users');
    
    const user = await users.findOne({ 
      _id: typeof userId === 'string' ? new (await import('mongodb')).ObjectId(userId) : userId 
    });
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return { user, users, db };
  }

  /**
   * Check and update daily credits
   */
  static async updateDailyCredits(user, users) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let credits = user.credits ?? this.DAILY_CREDITS;
    let lastCreditReset = user.lastCreditReset ? new Date(user.lastCreditReset) : null;

    // Reset credits if it's a new day
    if (!lastCreditReset || lastCreditReset < today) {
      credits = this.DAILY_CREDITS;
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            credits, 
            lastCreditReset: now 
          } 
        }
      );
    }

    return credits;
  }

  /**
   * Check if user can use a feature (consume credit if not pro)
   */
  static async checkAndConsumeCredit(authHeader) {
    try {
      const { user, users } = await this.authenticateUser(authHeader);
      const isPro = user.isPro || user.pro === true;
      
      // Update daily credits
      const credits = await this.updateDailyCredits(user, users);

      // If user is pro, allow unlimited access
      if (isPro) {
        return {
          success: true,
          isPro: true,
          credits: 'unlimited',
          user
        };
      }

      // Check if user has credits
      if (credits <= 0) {
        return {
          success: false,
          error: 'Daily limit reached. Upgrade to Pro for unlimited access.',
          credits: 0,
          isPro: false,
          statusCode: 429
        };
      }

      // Consume one credit
      await users.updateOne(
        { _id: user._id },
        { $inc: { credits: -1 } }
      );

      return {
        success: true,
        isPro: false,
        credits: credits - 1,
        user
      };

    } catch (error) {
      let statusCode = 500;
      let errorMessage = 'Internal server error';

      switch (error.message) {
        case 'UNAUTHORIZED':
          statusCode = 401;
          errorMessage = 'Unauthorized';
          break;
        case 'INVALID_TOKEN':
          statusCode = 401;
          errorMessage = 'Invalid or expired token';
          break;
        case 'USER_NOT_FOUND':
          statusCode = 404;
          errorMessage = 'User not found';
          break;
        default:
          console.error('Credits service error:', error);
      }

      return {
        success: false,
        error: errorMessage,
        statusCode
      };
    }
  }

  /**
   * Get user credits without consuming
   */
  static async getUserCredits(authHeader) {
    try {
      const { user, users } = await this.authenticateUser(authHeader);
      const isPro = user.isPro || user.pro === true;
      
      // Update daily credits
      const credits = await this.updateDailyCredits(user, users);

      return {
        success: true,
        credits: isPro ? 'unlimited' : credits,
        isPro,
        user
      };

    } catch (error) {
      let statusCode = 500;
      let errorMessage = 'Internal server error';

      switch (error.message) {
        case 'UNAUTHORIZED':
          statusCode = 401;
          errorMessage = 'Unauthorized';
          break;
        case 'INVALID_TOKEN':
          statusCode = 401;
          errorMessage = 'Invalid or expired token';
          break;
        case 'USER_NOT_FOUND':
          statusCode = 404;
          errorMessage = 'User not found';
          break;
        default:
          console.error('Credits service error:', error);
      }

      return {
        success: false,
        error: errorMessage,
        statusCode
      };
    }
  }

  /**
   * Middleware function for API routes
   */
  static async middleware(request) {
    const authHeader = request.headers.get('authorization');
    const result = await this.checkAndConsumeCredit(authHeader);
    
    if (!result.success) {
      return {
        response: new Response(
          JSON.stringify({ 
            error: result.error,
            credits: result.credits || 0,
            isPro: result.isPro || false
          }),
          { 
            status: result.statusCode,
            headers: { 'Content-Type': 'application/json' }
          }
        ),
        user: null
      };
    }

    return {
      response: null,
      user: result.user,
      credits: result.credits,
      isPro: result.isPro
    };
  }
}

export default CreditsService;
