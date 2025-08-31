import clientPromise from '../../lib/mongodb';
import jwt from 'jsonwebtoken';

/**
 * Enhanced Credits Service - Real-time credit management with transaction logging
 */
export class CreditsService {
  static DAILY_CREDITS = 3;
  
  // Credit transaction types
  static TRANSACTION_TYPES = {
    CONSUME: 'consume',
    REFILL: 'refill',
    BONUS: 'bonus',
    PURCHASE: 'purchase',
    DAILY_RESET: 'daily_reset'
  };

  // Credit consuming actions
  static CREDIT_ACTIONS = {
    RESUME_PARSE: 'resume_parse',
    JOB_SEARCH: 'job_search',
    PDF_GENERATION: 'pdf_generation',
    ATS_ANALYSIS: 'ats_analysis',
    COVER_LETTER: 'cover_letter_generation',
    GENERAL: 'general'
  };

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
  static async checkAndConsumeCredit(authHeader, action = this.CREDIT_ACTIONS.GENERAL) {
    try {
      const { user, users, db } = await this.authenticateUser(authHeader);
      const isPro = user.isPro || user.pro === true;
      
      // Update daily credits
      const credits = await this.updateDailyCredits(user, users);

      // If user is pro, allow unlimited access but still log the transaction
      if (isPro) {
        await this.logCreditTransaction(db, user._id, this.TRANSACTION_TYPES.CONSUME, 0, action, {
          isPro: true,
          creditsRemaining: 'unlimited'
        });

        return {
          success: true,
          isPro: true,
          credits: 'unlimited',
          user,
          transaction: {
            type: this.TRANSACTION_TYPES.CONSUME,
            action,
            amount: 0,
            timestamp: new Date().toISOString()
          }
        };
      }

      // Check if user has credits
      if (credits <= 0) {
        return {
          success: false,
          error: 'Daily limit reached. Upgrade to Pro for unlimited access.',
          credits: 0,
          isPro: false,
          statusCode: 429,
          action
        };
      }

      // Consume one credit with transaction logging
      const newCredits = credits - 1;
      await users.updateOne(
        { _id: user._id },
        { 
          $inc: { credits: -1 },
          $set: { updatedAt: new Date() }
        }
      );

      // Log the credit transaction
      const transaction = await this.logCreditTransaction(
        db, 
        user._id, 
        this.TRANSACTION_TYPES.CONSUME, 
        1, 
        action, 
        {
          creditsRemaining: newCredits,
          previousCredits: credits
        }
      );

      return {
        success: true,
        isPro: false,
        credits: newCredits,
        user,
        transaction
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
        user,
        lastUpdated: new Date().toISOString()
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
  static async middleware(request, action = this.CREDIT_ACTIONS.GENERAL) {
    const authHeader = request.headers.get('authorization');
    const result = await this.checkAndConsumeCredit(authHeader, action);
    
    if (!result.success) {
      return {
        response: new Response(
          JSON.stringify({ 
            error: result.error,
            credits: result.credits || 0,
            isPro: result.isPro || false,
            action: result.action
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
      isPro: result.isPro,
      transaction: result.transaction
    };
  }

  /**
   * Log credit transaction with detailed metadata
   */
  static async logCreditTransaction(db, userId, type, amount, action, metadata = {}) {
    try {
      const transactions = db.collection('credit_transactions');
      
      const transaction = {
        userId: userId.toString(),
        type,
        amount,
        action,
        metadata: {
          ...metadata,
          userAgent: metadata.userAgent || 'unknown',
          ip: metadata.ip || 'unknown'
        },
        timestamp: new Date(),
        createdAt: new Date().toISOString()
      };

      const result = await transactions.insertOne(transaction);
      
      return {
        id: result.insertedId.toString(),
        ...transaction,
        timestamp: transaction.timestamp.toISOString()
      };
    } catch (error) {
      console.error('Error logging credit transaction:', error);
      throw error;
    }
  }

  /**
   * Validate credit operation before execution
   */
  static async validateCreditOperation(authHeader, action, requiredCredits = 1) {
    try {
      const { user } = await this.authenticateUser(authHeader);
      const isPro = user.isPro || user.pro === true;

      if (isPro) {
        return {
          valid: true,
          isPro: true,
          credits: 'unlimited',
          message: 'Pro user - unlimited access'
        };
      }

      const credits = user.credits || 0;
      
      if (credits < requiredCredits) {
        return {
          valid: false,
          isPro: false,
          credits,
          requiredCredits,
          message: `Insufficient credits. Required: ${requiredCredits}, Available: ${credits}`,
          action
        };
      }

      return {
        valid: true,
        isPro: false,
        credits,
        requiredCredits,
        message: 'Sufficient credits available'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'Credit validation failed'
      };
    }
  }

  /**
   * Get credit transaction history for a user
   */
  static async getCreditTransactionHistory(authHeader, options = {}) {
    try {
      const { user, db } = await this.authenticateUser(authHeader);
      const { limit = 20, skip = 0, type = null } = options;
      
      const transactions = db.collection('credit_transactions');
      const query = { userId: user._id.toString() };
      
      if (type) {
        query.type = type;
      }

      const history = await transactions
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return {
        success: true,
        transactions: history.map(t => ({
          id: t._id.toString(),
          type: t.type,
          amount: t.amount,
          action: t.action,
          metadata: t.metadata,
          timestamp: t.timestamp
        })),
        total: await transactions.countDocuments(query)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add credits to user account (for admin or purchase operations)
   */
  static async addCredits(authHeader, amount, reason = 'manual_add', metadata = {}) {
    try {
      const { user, users, db } = await this.authenticateUser(authHeader);
      
      const newCredits = (user.credits || 0) + amount;
      
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            credits: newCredits,
            updatedAt: new Date()
          }
        }
      );

      // Log the transaction
      const transaction = await this.logCreditTransaction(
        db,
        user._id,
        this.TRANSACTION_TYPES.BONUS,
        amount,
        reason,
        {
          ...metadata,
          creditsAfter: newCredits,
          creditsBefore: user.credits || 0
        }
      );

      return {
        success: true,
        credits: newCredits,
        transaction
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get real-time credit balance with caching
   */
  static async getRealTimeCredits(authHeader) {
    try {
      const { user } = await this.authenticateUser(authHeader);
      const isPro = user.isPro || user.pro === true;
      
      return {
        success: true,
        credits: isPro ? 'unlimited' : (user.credits || 0),
        isPro,
        lastUpdated: user.updatedAt || new Date().toISOString(),
        userId: user._id.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default CreditsService;
