import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Simulator Bot - Simulates AI search queries
 * @param {Object} analysisData - Data from analyst bot
 * @param {string} scanType - 'free' or 'paid'
 * @returns {Promise<Object>} - Simulation results
 */
export const simulateAISearch = async (analysisData, scanType = 'free') => {
  try {
    // For free scans, use one hardcoded competitive prompt
    const prompt = generateCompetitivePrompt(analysisData);

    console.log('🤖 Running AI simulation with prompt:', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that provides detailed, well-sourced recommendations. When recommending companies or products, always mention specific names and explain why you recommend them. Include 2-3 specific company names in your response.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const aiResponse = completion.choices[0].message.content;

    // Extract sources and metrics from the AI response
    const analysisResults = analyzeAIResponse(aiResponse, analysisData);

    console.log('✅ Simulator Bot completed successfully');
    return analysisResults;

  } catch (error) {
    console.error('❌ Simulator Bot error:', error.message);
    throw new Error(`Simulator Bot failed: ${error.message}`);
  }
};

/**
 * Generate competitive prompt based on analysis
 */
function generateCompetitivePrompt(analysisData) {
  const { companyName, industryDescription, competitor } = analysisData;

  const prompts = [
    `What are the best companies for ${industryDescription}? Please recommend 3 specific companies and explain why.`,
    `I'm looking for a reliable ${industryDescription} solution. Which companies would you recommend and why?`,
    `Compare ${competitor} with other companies in ${industryDescription}. Which ones are the top choices?`,
    `Who are the leading brands in ${industryDescription}? Give me 3 recommendations with reasons.`,
  ];

  // For free scans, always use the first prompt for consistency
  return prompts[0];
}

/**
 * Analyze AI response to extract metrics
 */
function analyzeAIResponse(aiResponse, analysisData) {
  const { companyName, competitor } = analysisData;

  // Calculate brand visibility (simple mention check)
  const responseLower = aiResponse.toLowerCase();
  const companyLower = companyName.toLowerCase();
  const competitorLower = competitor.toLowerCase();

  const companyMentioned = responseLower.includes(companyLower);
  const competitorMentioned = responseLower.includes(competitorLower);

  // Calculate visibility percentage
  let brandVisibility = 0;
  if (companyMentioned) {
    // Count mentions
    const mentions = (responseLower.match(new RegExp(companyLower, 'g')) || []).length;
    brandVisibility = Math.min(mentions * 25, 100); // 25% per mention, max 100%
  }

  // Determine brand ranking
  let brandRanking = 0;
  if (companyMentioned) {
    // Check position in response
    const companyPosition = responseLower.indexOf(companyLower);
    const competitorPosition = responseLower.indexOf(competitorLower);

    if (companyPosition < competitorPosition || competitorPosition === -1) {
      brandRanking = 1;
    } else {
      brandRanking = 2;
    }
  }

  // Analyze sentiment
  const positiveWords = ['best', 'excellent', 'top', 'leading', 'great', 'outstanding', 'recommended'];
  const negativeWords = ['poor', 'bad', 'avoid', 'disappointing', 'lacking'];
  
  let sentiment = 'Neutral';
  if (companyMentioned) {
    const contextAround = getContextAroundMention(aiResponse, companyName, 50);
    const contextLower = contextAround.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => contextLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => contextLower.includes(word)).length;
    
    if (positiveCount > negativeCount) sentiment = 'Positive';
    else if (negativeCount > positiveCount) sentiment = 'Negative';
  }

  // Extract sources (simulate - in real implementation, this would parse citations)
  const sources = extractSimulatedSources(aiResponse);

  return {
    aiResponse,
    sources,
    brandVisibility,
    sentiment,
    brandRanking,
    companyMentioned,
    competitorMentioned,
  };
}

/**
 * Get text context around a mention
 */
function getContextAroundMention(text, mention, wordCount) {
  const index = text.toLowerCase().indexOf(mention.toLowerCase());
  if (index === -1) return '';

  const start = Math.max(0, index - wordCount);
  const end = Math.min(text.length, index + mention.length + wordCount);
  
  return text.substring(start, end);
}

/**
 * Extract simulated sources from AI response
 */
function extractSimulatedSources(aiResponse) {
  // In a real implementation, this would parse actual citations
  // For now, we'll simulate some sources based on the response
  const sources = [];

  // Simulate 2-4 sources
  const sourceCount = Math.floor(Math.random() * 3) + 2;

  const simulatedDomains = [
    'techcrunch.com',
    'forbes.com',
    'businessinsider.com',
    'theverge.com',
    'wired.com',
  ];

  for (let i = 0; i < sourceCount; i++) {
    sources.push({
      url: `https://${simulatedDomains[i % simulatedDomains.length]}/article-${Date.now()}-${i}`,
      title: `Source ${i + 1}: Industry Analysis`,
      cited: true,
    });
  }

  return sources;
}