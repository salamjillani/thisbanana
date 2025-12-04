import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireSubscription } from '../middleware/auth.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

/**
 * POST /api/sources/analyze
 * Scrape source and extract author contact info
 */
router.post('/analyze', authenticate, requireSubscription(['peel', 'bunch', 'top_banana']), async (req, res) => {
  try {
    const { url } = req.body;
    const userId = req.user.id;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Validate URL
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    // Fetch and scrape the page
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // Extract author information
    const author = extractAuthor($, url);
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const domain = new URL(url).hostname;
    const publishedDate = extractPublishedDate($);

    // Look for contact email patterns
    const emails = extractEmails($, author);
    const authorEmail = emails.length > 0 ? emails[0] : null;

    // Save source to database
    const { data: source, error } = await supabase
      .from('sources')
      .upsert([
        {
          user_id: userId,
          url: url,
          title: title,
          author: author,
          author_email: authorEmail,
          published_date: publishedDate,
          domain: domain,
          mentions_count: 1,
          last_mentioned_at: new Date().toISOString(),
          outreach_status: 'not_contacted',
        },
      ], {
        onConflict: 'user_id,url',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      source: {
        id: source.id,
        url: source.url,
        title: source.title,
        author: source.author,
        authorEmail: source.author_email,
        domain: source.domain,
        publishedDate: source.published_date,
      },
      message: 'Source analyzed and saved',
    });

  } catch (error) {
    console.error('Source analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze source',
      message: error.message,
    });
  }
});

/**
 * Helper: Extract author name from page
 */
function extractAuthor($, url) {
  // Try common author selectors
  const selectors = [
    '[rel="author"]',
    '.author-name',
    '.by-author',
    'span.author',
    'a[rel="author"]',
    '.article-author',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      return element.text().trim();
    }
  }

  // Try meta tags
  const metaAuthor = $('meta[name="author"]').attr('content');
  if (metaAuthor) return metaAuthor;

  // Fallback to domain name
  return new URL(url).hostname.replace('www.', '');
}

/**
 * Helper: Extract published date
 */
function extractPublishedDate($) {
  const dateSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="publish_date"]',
    'time[datetime]',
  ];

  for (const selector of dateSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const dateStr = element.attr('content') || element.attr('datetime');
      if (dateStr) return new Date(dateStr).toISOString();
    }
  }

  return new Date().toISOString();
}

/**
 * Helper: Extract email addresses from page
 */
function extractEmails($, author) {
  const emails = [];
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // Check entire page text for emails
  const pageText = $.text();
  const matches = pageText.match(emailPattern) || [];

  // Filter and deduplicate
  matches.forEach(email => {
    if (!emails.includes(email) && !email.includes('noreply')) {
      emails.push(email);
    }
  });

  return emails;
}

export default router;