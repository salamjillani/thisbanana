import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireSubscription, checkUsageLimit } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Get dashboard overview stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user metadata for usage info
    const { data: userMeta, error: metaError } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('id', userId)
      .single();

    // If user metadata doesn't exist, create it with defaults
    if (metaError && metaError.code === 'PGRST116') {
      console.log(`Creating user_metadata for user ${userId}`);
      
      const { data: newUserMeta, error: createError } = await supabase
        .from('user_metadata')
        .insert([
          {
            id: userId,
            subscription_tier: 'free',
            subscription_status: 'active',
            simulations_used: 0,
            simulations_limit: 0,
            blog_posts_used: 0,
            blog_posts_limit: 0,
            competitor_limit: 0,
            simulations_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            blog_posts_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user_metadata:', createError);
        return res.status(500).json({
          success: false,
          error: 'Failed to initialize user profile',
          details: createError.message,
        });
      }

      // Use the newly created metadata
      const finalUserMeta = newUserMeta;
      
      return res.json({
        success: true,
        stats: {
          totalScans: 0,
          averageVisibility: 0,
          latestScan: null,
          usage: {
            simulations: {
              used: 0,
              limit: 0,
              remaining: 0,
              resetDate: finalUserMeta.simulations_reset_date,
            },
            blogPosts: {
              used: 0,
              limit: 0,
              remaining: 0,
              resetDate: finalUserMeta.blog_posts_reset_date,
            },
            competitors: {
              limit: 0,
            },
          },
          subscription: {
            tier: 'free',
            status: 'active',
          },
        },
      });
    }

    // If there was a different error
    if (metaError && metaError.code !== 'PGRST116') {
      console.error('Error fetching user_metadata:', metaError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user data',
        details: metaError.message,
      });
    }

    // Get total scans
    const { count: totalScans } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get latest scan
    const { data: latestScan } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get average visibility
    const { data: scans } = await supabase
      .from('scans')
      .select('brand_visibility')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const avgVisibility = scans?.length > 0
      ? Math.round(scans.reduce((sum, s) => sum + (s.brand_visibility || 0), 0) / scans.length)
      : 0;

    // Calculate remaining usage
    const simulationsRemaining = userMeta.simulations_limit === -1 
      ? 'unlimited' 
      : Math.max(0, userMeta.simulations_limit - userMeta.simulations_used);

    const blogPostsRemaining = userMeta.blog_posts_limit === -1 
      ? 'unlimited' 
      : Math.max(0, userMeta.blog_posts_limit - userMeta.blog_posts_used);

    res.json({
      success: true,
      stats: {
        totalScans: totalScans || 0,
        averageVisibility: avgVisibility,
        latestScan: latestScan ? {
          companyName: latestScan.company_name,
          visibility: latestScan.brand_visibility,
          sentiment: latestScan.sentiment,
          createdAt: latestScan.created_at,
        } : null,
        usage: {
          simulations: {
            used: userMeta.simulations_used,
            limit: userMeta.simulations_limit,
            remaining: simulationsRemaining,
            resetDate: userMeta.simulations_reset_date,
          },
          blogPosts: {
            used: userMeta.blog_posts_used,
            limit: userMeta.blog_posts_limit,
            remaining: blogPostsRemaining,
            resetDate: userMeta.blog_posts_reset_date,
          },
          competitors: {
            limit: userMeta.competitor_limit,
          },
        },
        subscription: {
          tier: userMeta.subscription_tier,
          status: userMeta.subscription_status,
        },
      },
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/dashboard/historical
 * Get historical metrics (paid feature)
 */
router.get('/historical', authenticate, requireSubscription(['peel', 'bunch', 'top_banana']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const { data: metrics, error } = await supabase
      .from('historical_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    // Format data for charts
    const visibilityData = metrics.map(m => ({
      date: m.recorded_at,
      value: m.brand_visibility,
    }));

    const sentimentData = metrics.map(m => ({
      date: m.recorded_at,
      sentiment: m.sentiment,
    }));

    res.json({
      success: true,
      data: {
        visibility: visibilityData,
        sentiment: sentimentData,
      },
    });

  } catch (error) {
    console.error('Historical metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/dashboard/sources
 * Get all sources (paid feature)
 */
router.get('/sources', authenticate, requireSubscription(['peel', 'bunch', 'top_banana']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, status } = req.query;

    let query = supabase
      .from('sources')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('mentions_count', { ascending: false });

    if (status) {
      query = query.eq('outreach_status', status);
    }

    const { data: sources, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      sources: sources,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });

  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/dashboard/sources/:id
 * Update source outreach status (paid feature)
 */
router.put('/sources/:id', authenticate, requireSubscription(['peel', 'bunch', 'top_banana']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { outreach_status, outreach_notes } = req.body;

    const updateData = {
      outreach_status,
      outreach_notes,
      updated_at: new Date().toISOString(),
    };

    if (outreach_status === 'contacted') {
      updateData.contacted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('sources')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      source: data,
    });

  } catch (error) {
    console.error('Update source error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/dashboard/competitors
 * Get competitor analysis (paid feature)
 */
router.get('/competitors', authenticate, requireSubscription(['peel', 'bunch', 'top_banana']), async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: competitors, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('user_id', userId)
      .order('latest_visibility', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      competitors: competitors,
    });

  } catch (error) {
    console.error('Competitors error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/dashboard/competitors
 * Add a competitor to track (paid feature with limit check)
 */
router.post('/competitors', authenticate, requireSubscription(['peel', 'bunch', 'top_banana']), checkUsageLimit('competitors'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { competitor_name, competitor_url, industry } = req.body;

    if (!competitor_name) {
      return res.status(400).json({
        success: false,
        error: 'Competitor name is required',
      });
    }

    const { data, error } = await supabase
      .from('competitors')
      .insert([
        {
          user_id: userId,
          competitor_name,
          competitor_url,
          industry,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          error: 'This competitor is already being tracked',
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      competitor: data,
    });

  } catch (error) {
    console.error('Add competitor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/dashboard/competitors/:id
 * Remove a competitor (paid feature)
 */
router.delete('/competitors/:id', authenticate, requireSubscription(['peel', 'bunch', 'top_banana']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('competitors')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Competitor removed',
    });

  } catch (error) {
    console.error('Delete competitor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;