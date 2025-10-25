import OpenAI from 'openai';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schema for validation
const AnalysisSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  industryDescription: z.string().min(5, 'Industry description must be at least 5 characters'),
  competitor: z.string().min(1, 'Competitor name is required'),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']).default('Neutral'),
});

/**
 * Analyst Bot - Uses OpenAI to extract structured data
 * @param {Object} scrapedData - Data from scraper bot
 * @returns {Promise<Object>} - Analyzed data
 */
export const analyzeContent = async (scrapedData) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prompt = `
You are an expert business analyst. Analyze the following website content and extract structured information.

Website Title: ${scrapedData.title}
Meta Description: ${scrapedData.metaDescription}
Main Content: ${scrapedData.textContent.substring(0, 2000)}
Headings: ${scrapedData.headings.join(', ')}

Based on this content, provide the following information in valid JSON format:

{
  "companyName": "The exact company or brand name",
  "industryDescription": "A brief 1-2 sentence description of their industry/business",
  "competitor": "Name ONE direct competitor in their space",
  "sentiment": "Overall sentiment of the content (Positive, Neutral, or Negative)"
}

Rules:
- Be specific and accurate
- Use only information from the provided content
- If you cannot determine something, make your best educated guess based on the industry
- Return ONLY valid JSON, no additional text`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst that returns only valid JSON responses.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const text = completion.choices[0].message.content.trim();

      // Parse JSON
      const parsed = JSON.parse(text);

      // Validate with Zod
      const validated = AnalysisSchema.parse(parsed);

      console.log(`✅ Analyst Bot completed successfully (attempt ${attempt})`);
      return validated;

    } catch (error) {
      lastError = error;
      console.error(`❌ Analyst Bot attempt ${attempt} failed:`, error.message);

      // Exponential backoff
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // If all retries failed
  throw new Error(`Analyst Bot failed after ${maxRetries} attempts: ${lastError.message}`);
};