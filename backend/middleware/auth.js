import supabase from '../config/supabase.js';

/**
 * Authentication middleware - verifies JWT token (optional for some routes)
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue anyway
  }
};

/**
 * Subscription middleware - checks if user has active paid subscription
 */
export const requireSubscription = (allowedTiers = ['peel', 'bunch', 'top_banana']) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get user metadata with subscription info
      const { data: userMeta, error } = await supabase
        .from('user_metadata')
        .select('subscription_tier, subscription_status')
        .eq('id', userId)
        .single();

      if (error || !userMeta) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Unable to verify subscription status',
        });
      }

      // Check if user has an allowed subscription tier
      if (!allowedTiers.includes(userMeta.subscription_tier)) {
        return res.status(403).json({
          success: false,
          error: 'Subscription Required',
          message: 'This feature requires a paid subscription',
          currentTier: userMeta.subscription_tier,
          requiredTiers: allowedTiers,
        });
      }

      // Check if subscription is active
      if (userMeta.subscription_status !== 'active' && userMeta.subscription_status !== 'trialing') {
        return res.status(403).json({
          success: false,
          error: 'Inactive Subscription',
          message: 'Your subscription is not active',
          subscriptionStatus: userMeta.subscription_status,
        });
      }

      // Attach subscription info to request
      req.subscription = userMeta;
      next();

    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to verify subscription',
      });
    }
  };
};

/**
 * Check usage limits middleware
 */
export const checkUsageLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get user metadata
      const { data: userMeta, error } = await supabase
        .from('user_metadata')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !userMeta) {
        return res.status(500).json({
          success: false,
          error: 'Failed to check usage limits',
        });
      }

      // Check specific limit type
      if (limitType === 'simulations') {
        const limit = userMeta.simulations_limit;
        const used = userMeta.simulations_used;

        // -1 means unlimited
        if (limit === -1) {
          req.hasUnlimitedUsage = true;
          return next();
        }

        // 0 means free tier (no simulations)
        if (limit === 0) {
          return res.status(403).json({
            success: false,
            error: 'Upgrade Required',
            message: 'Free tier does not include AI simulations. Please upgrade to access this feature.',
          });
        }

        if (used >= limit) {
          return res.status(403).json({
            success: false,
            error: 'Usage Limit Reached',
            message: `You've reached your monthly limit of ${limit} simulations. Upgrade or wait until ${userMeta.simulations_reset_date}.`,
            limit,
            used,
            resetDate: userMeta.simulations_reset_date,
          });
        }
      }

      if (limitType === 'blog_posts') {
        const limit = userMeta.blog_posts_limit;
        const used = userMeta.blog_posts_used;

        if (limit === -1) {
          req.hasUnlimitedUsage = true;
          return next();
        }

        if (limit === 0) {
          return res.status(403).json({
            success: false,
            error: 'Upgrade Required',
            message: 'Free tier does not include AI blog posts. Please upgrade to access this feature.',
          });
        }

        if (used >= limit) {
          return res.status(403).json({
            success: false,
            error: 'Usage Limit Reached',
            message: `You've reached your monthly limit of ${limit} blog posts. Upgrade or wait until ${userMeta.blog_posts_reset_date}.`,
            limit,
            used,
            resetDate: userMeta.blog_posts_reset_date,
          });
        }
      }

      if (limitType === 'competitors') {
        const limit = userMeta.competitor_limit;
        
        // Count current competitors
        const { count } = await supabase
          .from('competitors')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (limit === -1) {
          req.hasUnlimitedUsage = true;
          return next();
        }

        if (limit === 0) {
          return res.status(403).json({
            success: false,
            error: 'Upgrade Required',
            message: 'Free tier does not include competitor tracking. Please upgrade to access this feature.',
          });
        }

        if (count >= limit) {
          return res.status(403).json({
            success: false,
            error: 'Limit Reached',
            message: `You've reached your limit of ${limit} tracked competitors. Upgrade to track more.`,
            limit,
            current: count,
          });
        }
      }

      req.userMeta = userMeta;
      next();

    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check usage limits',
      });
    }
  };
};

/**
 * Increment usage counter (FIXED - No more supabase.raw)
 * Fetches current value, increments, and updates
 */
export const incrementUsage = async (userId, usageType) => {
  try {
    if (usageType === 'simulations') {
      // Step 1: Get current value
      const { data: userMeta, error: fetchError } = await supabase
        .from('user_metadata')
        .select('simulations_used')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch simulations_used:', fetchError);
        return;
      }

      // Step 2: Calculate new value
      const currentValue = userMeta?.simulations_used || 0;
      const newValue = currentValue + 1;

      // Step 3: Update with new value
      const { error: updateError } = await supabase
        .from('user_metadata')
        .update({ simulations_used: newValue })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to increment simulations_used:', updateError);
      } else {
        console.log(`✅ Simulations used incremented to ${newValue} for user ${userId}`);
      }
    }

    if (usageType === 'blog_posts') {
      // Step 1: Get current value
      const { data: userMeta, error: fetchError } = await supabase
        .from('user_metadata')
        .select('blog_posts_used')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch blog_posts_used:', fetchError);
        return;
      }

      // Step 2: Calculate new value
      const currentValue = userMeta?.blog_posts_used || 0;
      const newValue = currentValue + 1;

      // Step 3: Update with new value
      const { error: updateError } = await supabase
        .from('user_metadata')
        .update({ blog_posts_used: newValue })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to increment blog_posts_used:', updateError);
      } else {
        console.log(`✅ Blog posts used incremented to ${newValue} for user ${userId}`);
      }
    }

  } catch (error) {
    console.error('Failed to increment usage:', error);
    // Don't throw - allow operation to continue even if usage tracking fails
  }
};

export default { 
  authenticate, 
  optionalAuthenticate,
  requireSubscription, 
  checkUsageLimit, 
  incrementUsage 
};