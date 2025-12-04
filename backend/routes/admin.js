import express from 'express';
import supabase from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * Middleware: Verify admin access
 */
const verifyAdmin = async (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'];
  
  if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  next();
};

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    let query = supabase
      .from('user_metadata')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data: users, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        fullName: user.full_name,
        company: user.company_name,
        email: user.email,
        tier: user.subscription_tier,
        status: user.subscription_status,
        createdAt: user.created_at,
        customerId: user.stripe_customer_id,
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

/**
 * GET /api/admin/user/:id
 * Get single user details
 */
router.get('/user/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get user stats
    const { count: scanCount } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { count: blogCount } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { count: competitorCount } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        company: user.company_name,
        companyUrl: user.company_url,
        tier: user.subscription_tier,
        status: user.subscription_status,
        createdAt: user.created_at,
        stats: {
          scans: scanCount,
          blogPosts: blogCount,
          competitors: competitorCount,
        },
      },
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

/**
 * POST /api/admin/user/:id/impersonate
 * Generate impersonation token
 */
router.post('/user/:id/impersonate', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user exists
    const { data: user, error } = await supabase
      .from('user_metadata')
      .select('id')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Create impersonation token (valid for 1 hour)
    const token = Buffer.from(JSON.stringify({
      userId: id,
      isImpersonation: true,
      createdAt: new Date().getTime(),
      expiresAt: new Date().getTime() + 3600000,
    })).toString('base64');

    res.json({
      success: true,
      impersonationToken: token,
      message: 'Login as this user on the frontend with this token',
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate impersonation token',
    });
  }
});

/**
 * GET /api/admin/metrics
 * Get business metrics
 */
router.get('/metrics', verifyAdmin, async (req, res) => {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('user_metadata')
      .select('*', { count: 'exact', head: true });

    // Active subscribers
    const { count: activeSubscribers } = await supabase
      .from('user_metadata')
      .select('*', { count: 'exact', head: true })
      .neq('subscription_tier', 'free')
      .eq('subscription_status', 'active');

    // Users by tier
    const { data: tierBreakdown } = await supabase
      .from('user_metadata')
      .select('subscription_tier')
      .neq('subscription_tier', 'free');

    // Calculate MRR (simplified - doesn't account for yearly)
    const tierPrices = {
      peel: 49.99,
      bunch: 99.99,
      top_banana: 0, // Custom pricing
    };

    let mrr = 0;
    tierBreakdown?.forEach(user => {
      mrr += tierPrices[user.subscription_tier] || 0;
    });

    // Growth rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newUsersThisMonth } = await supabase
      .from('user_metadata')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    res.json({
      success: true,
      metrics: {
        totalUsers,
        activeSubscribers,
        monthlyRecurringRevenue: mrr,
        newUsersThisMonth,
        tierBreakdown: {
          peel: tierBreakdown?.filter(u => u.subscription_tier === 'peel').length || 0,
          bunch: tierBreakdown?.filter(u => u.subscription_tier === 'bunch').length || 0,
          topBanana: tierBreakdown?.filter(u => u.subscription_tier === 'top_banana').length || 0,
        },
        growthRate: (newUsersThisMonth / totalUsers * 100).toFixed(2) + '%',
      },
    });

  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
    });
  }
});

/**
 * GET /api/admin/stats/overview
 * Get dashboard overview stats
 */
router.get('/stats/overview', verifyAdmin, async (req, res) => {
  try {
    const { count: totalScans } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true });

    const { count: totalBlogPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true });

    const { count: totalSources } = await supabase
      .from('sources')
      .select('*', { count: 'exact', head: true });

    const { count: totalCompetitors } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      stats: {
        totalScans,
        totalBlogPosts,
        totalSources,
        totalCompetitors,
      },
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    });
  }
});

/**
 * PUT /api/admin/user/:id/tier
 * Change user subscription tier (for demos)
 */
router.put('/user/:id/tier', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    const validTiers = ['free', 'peel', 'bunch', 'top_banana'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier',
      });
    }

    // Set limits based on tier
    const limits = {
      free: {
        simulations_limit: 0,
        blog_posts_limit: 0,
        competitor_limit: 0,
      },
      peel: {
        simulations_limit: 100,
        blog_posts_limit: 2,
        competitor_limit: 1,
      },
      bunch: {
        simulations_limit: 500,
        blog_posts_limit: 20,
        competitor_limit: 5,
      },
      top_banana: {
        simulations_limit: -1,
        blog_posts_limit: -1,
        competitor_limit: -1,
      },
    };

    const { data: user, error } = await supabase
      .from('user_metadata')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        ...limits[tier],
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `User upgraded to ${tier}`,
      user,
    });

  } catch (error) {
    console.error('Update tier error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user tier',
    });
  }
});

export default router;