import supabase from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 24 * 60 * 60 * 1000; // 24 hours
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 2;

/**
 * IP-based rate limiter using Supabase
 */
export const scanRateLimiter = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

    // Count requests from this IP in the time window
    const { data, error } = await supabase
      .from('scans')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', windowStart.toISOString())
      .eq('scan_type', 'free');

    if (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request to proceed
      return next();
    }

    const requestCount = data?.length || 0;

    if (requestCount >= MAX_REQUESTS) {
      // Calculate time until reset
      const { data: oldestScan } = await supabase
        .from('scans')
        .select('created_at')
        .eq('ip_address', ipAddress)
        .gte('created_at', windowStart.toISOString())
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      const resetTime = oldestScan 
        ? new Date(new Date(oldestScan.created_at).getTime() + RATE_LIMIT_WINDOW)
        : new Date(now.getTime() + RATE_LIMIT_WINDOW);

      const retryAfterMinutes = Math.ceil((resetTime - now) / 1000 / 60);

      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'You have reached the maximum number of free scans (2 per day). Please try again tomorrow or upgrade to a paid plan for unlimited scans.',
        retryAfter: retryAfterMinutes,
        resetTime: resetTime.toISOString(),
      });
    }

    // Add rate limit info to headers
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - requestCount - 1);
    res.setHeader('X-RateLimit-Reset', new Date(now.getTime() + RATE_LIMIT_WINDOW).toISOString());

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // On error, allow the request to proceed
    next();
  }
};

export default scanRateLimiter;