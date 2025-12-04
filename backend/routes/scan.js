import express from 'express';
import supabase from '../config/supabase.js';
import { scrapeUrl } from '../utils/scraper.js';
import { analyzeContent } from '../utils/analyst.js';
import { simulateAISearch } from '../utils/simulator.js';
import { optionalAuthenticate, authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/scan
 * Free scan endpoint - no authentication required
 */
router.post('/scan', optionalAuthenticate, async (req, res) => {
  try {
    const { url, sessionId } = req.body;
    const userId = req.user?.id || null;

    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Generate or use provided session ID for anonymous users
    const scanSessionId = sessionId || uuidv4();

    // Determine scan type based on user subscription
    let scanType = 'free';
    if (userId) {
      const { data: userMeta } = await supabase
        .from('user_metadata')
        .select('subscription_tier')
        .eq('id', userId)
        .single();
      
      // If user has metadata and paid subscription, set appropriate scan type
      if (userMeta && userMeta.subscription_tier !== 'free') {
        scanType = userMeta.subscription_tier; // 'peel', 'bunch', or 'top_banana'
      }
    }

    // Create scan record
    const { data: scan, error } = await supabase
      .from('scans')
      .insert([
        {
          url,
          user_id: userId,
          session_id: userId ? null : scanSessionId, // Only set session_id for anonymous
          scan_type: scanType, // 'free', 'peel', 'bunch', or 'top_banana'
          status: 'processing',
          claimed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create scan',
      });
    }

    // Send immediate response
    res.status(202).json({
      success: true,
      message: 'Scan initiated',
      scanId: scan.id,
      sessionId: scanSessionId,
      requiresAuth: !userId, // Tell frontend if they need to sign up for full results
    });

    // Process scan asynchronously
    processScan(scan.id, url, userId, scanSessionId).catch(error => {
      console.error('Scan processing error:', error);
    });

  } catch (error) {
    console.error('Scan endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/scan/:id
 * Get scan results (public for preview, full results require auth)
 */
router.get('/scan/:id', optionalAuthenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;
    const userId = req.user?.id;

    // Query scan - check if user owns it OR has valid session
    let query = supabase
      .from('scans')
      .select('*')
      .eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please provide sessionId or authenticate',
      });
    }

    const { data: scan, error } = await query.single();

    if (error || !scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found',
      });
    }

    // Determine what data to return based on auth status
    const isAuthenticated = !!userId;
    const isPaidUser = isAuthenticated && scan.scan_type !== 'free';

    // Basic preview data (always available)
    const previewData = {
      id: scan.id,
      url: scan.url,
      status: scan.status,
      companyName: scan.company_name,
      industryDescription: scan.industry_description,
      brandVisibility: scan.brand_visibility,
      sentiment: scan.sentiment,
      createdAt: scan.created_at,
    };

    // Full data (requires authentication)
    const fullData = {
      ...previewData,
      competitor: scan.competitor,
      aiResponse: scan.ai_response,
      brandRanking: scan.brand_ranking,
      error: scan.error,
    };

    // Premium data (requires paid subscription)
    const premiumData = {
      ...fullData,
      sources: scan.sources || [],
    };

    // Return appropriate data level
    if (isPaidUser) {
      return res.json({
        success: true,
        scan: premiumData,
        accessLevel: 'premium',
      });
    } else if (isAuthenticated) {
      return res.json({
        success: true,
        scan: fullData,
        accessLevel: 'full',
      });
    } else {
      return res.json({
        success: true,
        scan: previewData,
        accessLevel: 'preview',
        requiresAuth: true,
        message: 'Sign up to see complete results and track your progress',
      });
    }

  } catch (error) {
    console.error('Get scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/scan/:id/claim
 * Claim an anonymous scan after signup
 */
router.post('/scan/:id/claim', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required',
      });
    }

    // Find and claim the scan
    const { data: scan, error } = await supabase
      .from('scans')
      .update({
        user_id: userId,
        claimed: true,
        session_id: null,
      })
      .eq('id', id)
      .eq('session_id', sessionId)
      .is('user_id', null)
      .select()
      .single();

    if (error || !scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found or already claimed',
      });
    }

    res.json({
      success: true,
      message: 'Scan claimed successfully',
      scan: {
        id: scan.id,
        companyName: scan.company_name,
      },
    });

  } catch (error) {
    console.error('Claim scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/scans
 * Get all scans for authenticated user
 */
router.get('/scans', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const { data: scans, error, count } = await supabase
      .from('scans')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      scans: scans.map(scan => ({
        id: scan.id,
        url: scan.url,
        status: scan.status,
        companyName: scan.company_name,
        brandVisibility: scan.brand_visibility,
        sentiment: scan.sentiment,
        createdAt: scan.created_at,
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });

  } catch (error) {
    console.error('Get scans error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Process scan asynchronously
 */
async function processScan(scanId, url, userId, sessionId) {
  try {
    console.log(`🔄 Processing scan ${scanId}`);

    // Step 1: Scrape URL
    const scrapedData = await scrapeUrl(url);

    // Step 2: Analyze content
    const analysisData = await analyzeContent(scrapedData);

    // Step 3: Simulate AI search (basic for free users)
    const simulationData = await simulateAISearch(analysisData, 'preview');

    // Update scan record
    await supabase
      .from('scans')
      .update({
        company_name: analysisData.companyName,
        industry_description: analysisData.industryDescription,
        competitor: analysisData.competitor,
        ai_response: simulationData.aiResponse,
        sources: simulationData.sources,
        brand_visibility: simulationData.brandVisibility,
        sentiment: simulationData.sentiment,
        brand_ranking: simulationData.brandRanking,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    // If user is authenticated, store additional data
    if (userId) {
      // Store historical metrics
      await supabase
        .from('historical_metrics')
        .insert([
          {
            user_id: userId,
            scan_id: scanId,
            brand_visibility: simulationData.brandVisibility,
            sentiment: simulationData.sentiment,
            brand_ranking: simulationData.brandRanking,
            mentions_count: 1,
          },
        ]);

      // Store sources (for paid users)
      const { data: userMeta } = await supabase
        .from('user_metadata')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (userMeta?.subscription_tier !== 'free' && simulationData.sources?.length > 0) {
        const sourcesData = simulationData.sources.map(source => ({
          user_id: userId,
          url: source.url,
          title: source.title,
          mentions_count: 1,
          last_mentioned_at: new Date().toISOString(),
        }));

        await supabase
          .from('sources')
          .upsert(sourcesData, {
            onConflict: 'user_id,url',
            ignoreDuplicates: false,
          });
      }
    }

    console.log(`✅ Scan ${scanId} completed successfully`);

  } catch (error) {
    console.error(`❌ Scan ${scanId} failed:`, error.message);

    await supabase
      .from('scans')
      .update({
        status: 'failed',
        error: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scanId);
  }
}

export default router;