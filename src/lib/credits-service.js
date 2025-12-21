import clientPromise from '../../lib/mongodb';
import { UserService } from './user-service';

/**
 * Enhanced Credits Service - Real-time credit management with transaction logging
 *
 * IMPORTANT: Credits are now stored on the main user document in the `users` collection.
 * We no longer create a separate "credits user" schema. All lookups are done by `uid`.
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

  // Credit consuming actions with specific costs
  static CREDIT_ACTIONS = {
    RESUME_UPLOAD: 'resume_upload',           // 1 credit - for file upload/extraction
    RESUME_PARSE: 'resume_parse',             // 1 credit - for AI parsing/analysis
    JOB_SEARCH: 'job_search',                 // 1 credit - for job searching
    PDF_GENERATION: 'pdf_generation',         // 1 credit - for PDF/cover letter generation
    ATS_ANALYSIS: 'ats_analysis',             // 1 credit - for ATS compatibility check
    COVER_LETTER: 'cover_letter_generation',  // 1 credit - for cover letter generation
    ROLE_FIT_CHECK: 'role_fit_check',         // 1 credit - for role fit analysis
    RESUME_ENHANCEMENT: 'resume_enhancement', // 1 credit - for resume enhancement
    GENERAL: 'general'                        // 1 credit - for general operations
  };

  // Credit costs for each action
  static CREDIT_COSTS = {
    [this.CREDIT_ACTIONS.RESUME_UPLOAD]: 1,
    [this.CREDIT_ACTIONS.RESUME_PARSE]: 1,
    [this.CREDIT_ACTIONS.JOB_SEARCH]: 1,
    [this.CREDIT_ACTIONS.PDF_GENERATION]: 1,
    [this.CREDIT_ACTIONS.ATS_ANALYSIS]: 1,
    [this.CREDIT_ACTIONS.COVER_LETTER]: 1,
    [this.CREDIT_ACTIONS.ROLE_FIT_CHECK]: 1,
    [this.CREDIT_ACTIONS.RESUME_ENHANCEMENT]: 1,
    [this.CREDIT_ACTIONS.GENERAL]: 1
  };

  /**
   * Authenticate user and get user data from the main `users` collection.
   *
   * This method now uses the primary user model (uid-based) and will no longer
   * create a separate minimal "credits" user document. Legacy documents that
   * used `firebaseUid` or string _id values are ignored in favor of the main
   * user record where possible.
   */
  static async authenticateUser(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('UNAUTHORIZED');
    }

    const token = authHeader.replace('Bearer ', '');
    let userId;
    let firebaseDecoded = null;
    
    try {
      // Try Firebase ID token first (preferred path)
      const { auth } = await import('./firebase-admin');
      firebaseDecoded = await auth.verifyIdToken(token);
      userId = firebaseDecoded.uid;
    } catch (firebaseError) {
      // Fallback to JWT token for backward compatibility
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (jwtError) {
        console.error('Token verification failed:', { 
          firebaseError: firebaseError.message, 
          jwtError: jwtError.message 
        });
        throw new Error('INVALID_TOKEN');
      }
    }

    const client = await clientPromise;
    const db = client.db('roleFitAi');
    const users = db.collection('users');

    // 1. Prefer the main user document looked up by uid
    let user = await users.findOne({ uid: userId });

    // 2. If not found, try to migrate a legacy credits-only document if it exists
    if (!user) {
      const legacyUser = await users.findOne({ firebaseUid: userId }) ||
                         await users.findOne({ _id: userId });

      if (legacyUser) {
        const nowIso = new Date().toISOString();

        const update = {
          uid: userId,
          email: legacyUser.email || firebaseDecoded?.email || '',
          displayName: legacyUser.name || firebaseDecoded?.name || '',
          photoURL: firebaseDecoded?.picture || legacyUser.photoURL || '',
          emailVerified: firebaseDecoded?.email_verified ?? legacyUser.emailVerified ?? false,
          provider: legacyUser.provider || firebaseDecoded?.firebase?.sign_in_provider || 'email',
          lastLoginAt: nowIso,
          updatedAt: nowIso,
          credits: typeof legacyUser.credits === 'number' ? legacyUser.credits : this.DAILY_CREDITS,
          isPro: legacyUser.isPro || false,
          plan: legacyUser.plan || 'free',
          lastCreditReset: legacyUser.lastCreditReset || nowIso
        };

        await users.updateOne(
          { _id: legacyUser._id },
          { $set: update }
        );

        user = { ...legacyUser, ...update };
      }
    }

    // 3. If still not found, create a full user record using the main user model
    if (!user) {
      if (firebaseDecoded) {
        // Use the richer createOrUpdateUser logic when we have Firebase data
        user = await UserService.createOrUpdateUser(
          {
            uid: firebaseDecoded.uid,
            email: firebaseDecoded.email,
            displayName: firebaseDecoded.name,
            photoURL: firebaseDecoded.picture,
            emailVerified: firebaseDecoded.email_verified,
            providerData: firebaseDecoded.firebase?.sign_in_provider
              ? [{ providerId: firebaseDecoded.firebase.sign_in_provider }]
              : undefined
          },
          {
            acceptedTerms: false,
            isNotificationOn: true
          }
        );
      } else {
        // Fallback for JWT-only path where we don't have full Firebase user info
        const nowIso = new Date().toISOString();
        const newUser = {
          uid: userId,
          email: '',
          displayName: '',
          photoURL: '',
          emailVerified: false,
          provider: 'email',
          lastLoginAt: nowIso,
          updatedAt: nowIso,
          createdAt: nowIso,
          isNotificationOn: true,
          acceptedTerms: false,
          termsAcceptedAt: null,
          emailPreferences: {
            welcomeEmails: true,
            resumeUpdates: true,
            jobMatches: true,
            weeklyDigest: true,
            applicationReminders: true,
            marketingEmails: false
          },
          credits: this.DAILY_CREDITS,
          isPro: false,
          plan: 'free',
          lastCreditReset: nowIso
        };

        try {
          await users.insertOne(newUser);
          user = newUser;
        } catch (insertError) {
          // If insert fails due to duplicate key, try to find the user again by uid
          console.error('User creation race condition, retrying lookup by uid:', insertError.message);
          user = await users.findOne({ uid: userId });
          if (!user) {
            throw new Error('USER_CREATION_FAILED');
          }
        }
      }
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
   * Get credit cost for a specific action
   */
  static getCreditCost(action) {
    return this.CREDIT_COSTS[action] || 1;
  }

  /**
   * Check if user can perform action and get cost
   */
  static async validateActionCredits(authHeader, action) {
    const cost = this.getCreditCost(action);
    return await this.validateCreditsForAction(authHeader, action, cost);
  }

  /**
   * Consume credits for a specific action
   */
  static async consumeActionCredits(authHeader, action, metadata = {}) {
    const cost = this.getCreditCost(action);
    
    try {
      const { user, users, db } = await this.authenticateUser(authHeader);
      const isPro = user.isPro || user.pro === true;
      
      // Update daily credits
      const credits = await this.updateDailyCredits(user, users);

      if (isPro) {
        // Log transaction for pro users but don't consume credits
        const transaction = await this.logCreditTransaction(
          db, 
          user._id, 
          this.TRANSACTION_TYPES.CONSUME, 
          0, 
          action, 
          {
            isPro: true,
            creditsRemaining: 'unlimited',
            cost,
            ...metadata
          }
        );

        return {
          success: true,
          isPro: true,
          credits: 'unlimited',
          consumed: 0,
          cost,
          transaction,
          action
        };
      }

      if (credits < cost) {
        return {
          success: false,
          error: `Insufficient credits. Required: ${cost}, Available: ${credits}`,
          credits,
          isPro: false,
          statusCode: 429,
          cost,
          action
        };
      }

      // Consume credits atomically
      const newCredits = credits - cost;
      await users.updateOne(
        { _id: user._id },
        { 
          $inc: { credits: -cost },
          $set: { updatedAt: new Date() }
        }
      );

      // Log the transaction
      const transaction = await this.logCreditTransaction(
        db, 
        user._id, 
        this.TRANSACTION_TYPES.CONSUME, 
        cost, 
        action, 
        {
          creditsRemaining: newCredits,
          previousCredits: credits,
          cost,
          ...metadata
        }
      );

      return {
        success: true,
        isPro: false,
        credits: newCredits,
        consumed: cost,
        cost,
        transaction,
        action
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
          console.error('Credit consumption error:', error);
      }

      return {
        success: false,
        error: errorMessage,
        statusCode,
        action
      };
    }
  }

  /**
   * Validate credits for action without consuming
   */
  static async validateCreditsForAction(authHeader, action, requiredCredits = 1) {
    try {
      const { user, users } = await this.authenticateUser(authHeader);
      const isPro = user.isPro || user.pro === true;
      
      // Update daily credits
      const credits = await this.updateDailyCredits(user, users);

      if (isPro) {
        return {
          success: true,
          isPro: true,
          credits: 'unlimited',
          action
        };
      }

      if (credits < requiredCredits) {
        return {
          success: false,
          error: `Insufficient credits. Required: ${requiredCredits}, Available: ${credits}`,
          credits,
          isPro: false,
          statusCode: 429,
          action,
          requiredCredits
        };
      }

      return {
        success: true,
        isPro: false,
        credits,
        action,
        requiredCredits
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
          console.error('Credits validation error:', error);
      }

      return {
        success: false,
        error: errorMessage,
        statusCode
      };
    }
  }

  /**
   * Consume credits atomically (all or nothing)
   */
  static async consumeCreditsAtomic(authHeader, action, amount = 1) {
    try {
      const { user, users, db } = await this.authenticateUser(authHeader);
      const isPro = user.isPro || user.pro === true;
      
      // Update daily credits
      const credits = await this.updateDailyCredits(user, users);

      if (isPro) {
        // Log transaction for pro users but don't consume credits
        const transaction = await this.logCreditTransaction(
          db, 
          user._id, 
          this.TRANSACTION_TYPES.CONSUME, 
          0, 
          action, 
          {
            isPro: true,
            creditsRemaining: 'unlimited',
            amount
          }
        );

        return {
          success: true,
          isPro: true,
          credits: 'unlimited',
          transaction
        };
      }

      if (credits < amount) {
        return {
          success: false,
          error: `Insufficient credits. Required: ${amount}, Available: ${credits}`,
          credits,
          isPro: false,
          statusCode: 429
        };
      }

      // Consume credits atomically
      const newCredits = credits - amount;
      await users.updateOne(
        { _id: user._id },
        { 
          $inc: { credits: -amount },
          $set: { updatedAt: new Date() }
        }
      );

      // Log the transaction
      const transaction = await this.logCreditTransaction(
        db, 
        user._id, 
        this.TRANSACTION_TYPES.CONSUME, 
        amount, 
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
          console.error('Atomic credit consumption error:', error);
      }

      return {
        success: false,
        error: errorMessage,
        statusCode
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

// Export the validateUser function for backward compatibility
export const validateUser = CreditsService.authenticateUser;