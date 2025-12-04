import express from 'express';
import supabase from '../config/supabase.js';
import { simulateAISearch } from '../utils/simulator.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * POST /api/scheduled-scans/run
 * Run scheduled scans for all paying users (called by cron job)
 * 
 * This should be called daily by a service like:
 * - AWS Lambda
 * - Render background jobs
 * - GitHub Actions
 * - A cron service
 */
router.post('/run', async (req, res) => {
  // Verify request is from authorized cron service
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    console.log('🔄 Starting scheduled scans...');

    // Get all paying users
    const { data: users, error: usersError } = await supabase
      .from('user_metadata')
      .select('id, subscription_tier')
      .neq('subscription_tier', 'free')
      .eq('subscription_status', 'active');

    if (usersError) throw usersError;

    let processedCount = 0;
    let successCount = 0;

    // Process each user
    for (const user of users) {
      try {
        // Get user's latest scan
        const { data: latestScan } = await supabase
          .from('scans')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!latestScan) continue;

        // Run simulation
        const simulationData = await simulateAISearch(
          {
            companyName: latestScan.company_name,
            industryDescription: latestScan.industry_description,
            competitor: latestScan.competitor,
          },
          'full'
        );

        // Store historical metrics
        const { error: metricsError } = await supabase
          .from('historical_metrics')
          .insert([
            {
              user_id: user.id,
              scan_id: latestScan.id,
              brand_visibility: simulationData.brandVisibility,
              sentiment: simulationData.sentiment,
              brand_ranking: simulationData.brandRanking,
              mentions_count: latestScan.mentions_count || 1,
            },
          ]);

        if (!metricsError) {
          successCount++;
        }

        processedCount++;

      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        processedCount++;
      }
    }

    console.log(`✅ Scheduled scans completed: ${successCount}/${processedCount} successful`);

    res.json({
      success: true,
      message: 'Scheduled scans completed',
      processed: processedCount,
      successful: successCount,
    });

  } catch (error) {
    console.error('Scheduled scans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run scheduled scans',
      message: error.message,
    });
  }
});

/**
 * GET /api/scheduled-scans/status
 * Check last scheduled scan status
 */
router.get('/status', async (req, res) => {
  try {
    const { data: lastScan } = await supabase
      .from('stripe_events')
      .select('*')
      .eq('event_type', 'scheduled_scan')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      success: true,
      lastRun: lastScan?.created_at || null,
      status: lastScan?.processed ? 'completed' : 'pending',
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status',
    });
  }
});

export default router;