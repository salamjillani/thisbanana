import express from 'express';
import supabase from '../config/supabase.js';
import { scrapeUrl } from '../utils/scraper.js';
import { analyzeContent } from '../utils/analyst.js';
import { simulateAISearch } from '../utils/simulator.js';
import { scanRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/scan
 * Free scan endpoint with rate limiting
 */
router.post('/scan', scanRateLimiter, async (req, res) => {
  try {
    const { url } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    // Create scan record in Supabase
    const { data: scan, error } = await supabase
      .from('scans')
      .insert([
        {
          url,
          ip_address: ipAddress,
          scan_type: 'free',
          status: 'processing',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create scan',
        message: error.message,
      });
    }

    // Send immediate response with scan ID
    res.status(202).json({
      success: true,
      message: 'Scan initiated',
      scanId: scan.id,
    });

    // Process scan asynchronously
    processScan(scan.id, url).catch(error => {
      console.error('Scan processing error:', error);
    });

  } catch (error) {
    console.error('Scan endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/scan/:id
 * Get scan results by ID
 */
router.get('/scan/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: scan, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found',
      });
    }

    res.json({
      success: true,
      scan: {
        id: scan.id,
        url: scan.url,
        status: scan.status,
        companyName: scan.company_name,
        industryDescription: scan.industry_description,
        competitor: scan.competitor,
        aiResponse: scan.ai_response,
        sources: scan.sources || [],
        brandVisibility: scan.brand_visibility,
        sentiment: scan.sentiment,
        brandRanking: scan.brand_ranking,
        error: scan.error,
        createdAt: scan.created_at,
      },
    });

  } catch (error) {
    console.error('Get scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Process scan asynchronously
 */
async function processScan(scanId, url) {
  try {
    console.log(`🔄 Processing scan ${scanId} for URL: ${url}`);

    // Step 1: Scrape URL
    console.log('📡 Step 1: Scraping URL...');
    const scrapedData = await scrapeUrl(url);

    // Step 2: Analyze content
    console.log('🧠 Step 2: Analyzing content...');
    const analysisData = await analyzeContent(scrapedData);

    // Step 3: Simulate AI search
    console.log('🤖 Step 3: Simulating AI search...');
    const simulationData = await simulateAISearch(analysisData, 'free');

    // Update scan record in Supabase
    const { error } = await supabase
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

    if (error) {
      throw new Error(`Failed to update scan: ${error.message}`);
    }

    console.log(`✅ Scan ${scanId} completed successfully`);

  } catch (error) {
    console.error(`❌ Scan ${scanId} failed:`, error.message);

    // Update scan with error
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