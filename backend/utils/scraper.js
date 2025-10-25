import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scraper Bot - Extracts content from a URL
 * @param {string} url - The URL to scrape
 * @returns {Promise<Object>} - Scraped data including text content
 */
export const scrapeUrl = async (url) => {
  try {
    // Validate URL
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      throw new Error('Invalid URL format. Must start with http:// or https://');
    }

    // Fetch the page with timeout and proper headers
    const response = await axios.get(url, {
      timeout: 15000, // 15 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      maxRedirects: 5,
    });

    // Load HTML into Cheerio
    const $ = cheerio.load(response.data);

    // Remove script, style, and other non-content elements
    $('script, style, nav, footer, iframe, noscript').remove();

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || '';

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || 
                           '';

    // Extract main content text
    let textContent = '';
    
    // Priority selectors for main content
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      'body',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        textContent = element.text();
        break;
      }
    }

    // Clean up the text
    textContent = textContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 5000); // Limit to 5000 characters for AI processing

    // Extract headings for additional context
    const headings = [];
    $('h1, h2, h3').each((i, elem) => {
      if (i < 10) { // Limit to first 10 headings
        headings.push($(elem).text().trim());
      }
    });

    return {
      success: true,
      url,
      title,
      metaDescription,
      textContent,
      headings: headings.filter(h => h.length > 0),
      contentLength: textContent.length,
    };

  } catch (error) {
    console.error('Scraper Error:', error.message);

    // Handle specific error types
    if (error.code === 'ENOTFOUND') {
      throw new Error('Website not found. Please check the URL and try again.');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. The website took too long to respond.');
    } else if (error.response && error.response.status === 403) {
      throw new Error('Access denied. The website may be blocking automated requests.');
    } else if (error.response && error.response.status === 404) {
      throw new Error('Page not found (404). Please check the URL.');
    } else if (error.response && error.response.status >= 500) {
      throw new Error('The website server is experiencing issues. Please try again later.');
    }

    throw new Error(`Failed to scrape website: ${error.message}`);
  }
};