import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, checkUsageLimit, incrementUsage } from '../middleware/auth.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/blog/generate
 * Generate AI blog post with prompt chaining (paid feature)
 */
router.post('/generate', authenticate, checkUsageLimit('blog_posts'), async (req, res) => {
  try {
    const { topic, keywords, tone = 'professional', length = 'medium' } = req.body;
    const userId = req.user.id;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required',
      });
    }

    // Step 1: Generate Outline
    console.log('📝 Generating outline...');
    const outlineCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist. Create detailed, actionable outlines.',
        },
        {
          role: 'user',
          content: `Create a detailed outline for a ${length} blog post about: ${topic}
          
Include:
- 3-5 main sections with subsections
- Key points to cover
- Potential data points or statistics`,
        },
      ],
      temperature: 0.7,
    });

    const outline = outlineCompletion.choices[0].message.content;

    // Step 2: Write Content Sections
    console.log('✍️ Writing content...');
    const contentCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO content writer. Write engaging, high-quality content.',
        },
        {
          role: 'user',
          content: `Write a comprehensive ${tone} blog post using this outline:

Topic: ${topic}
${keywords ? `Keywords to incorporate: ${keywords}` : ''}

Outline:
${outline}

Requirements:
- Use markdown formatting with proper heading hierarchy
- 800-1500 words
- Incorporate keywords naturally
- Add real-world examples
- Include actionable takeaways
- Strong introduction and conclusion
- Call-to-action at the end`,
        },
      ],
      temperature: 0.7,
    });

    const content = contentCompletion.choices[0].message.content;

    // Step 3: Polish & Generate Meta (FIXED - Include 'json' in prompt)
    console.log('✨ Polishing content...');
    const metaCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert. Generate compelling meta descriptions. You must respond with valid JSON.',
        },
        {
          role: 'user',
          content: `Based on this blog post, generate a JSON object with:
1. "title": A compelling title (60 chars max)
2. "meta_description": Meta description (155 chars max)
3. "keywords": Array of 5-7 relevant keywords

Blog content:
${content.substring(0, 1000)}...

Return ONLY valid JSON object, no other text.`,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    // Parse the response safely
    let metadata;
    try {
      const rawContent = metaCompletion.choices[0].message.content;
      metadata = JSON.parse(rawContent);
    } catch (parseError) {
      console.warn('Failed to parse metadata JSON, using defaults:', parseError);
      metadata = {
        title: topic.substring(0, 60),
        meta_description: topic.substring(0, 155),
        keywords: keywords ? keywords.split(',').map(k => k.trim()).slice(0, 7) : [topic],
      };
    }

    // Save to database
    const { data: blogPost, error } = await supabase
      .from('blog_posts')
      .insert([
        {
          user_id: userId,
          title: metadata.title || 'Blog Post',
          content: content,
          target_keyword: keywords || (metadata.keywords?.join(', ') || topic),
          seo_optimized: true,
          prompt_used: `Topic: ${topic}, Keywords: ${keywords}`,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Increment usage counter
    await incrementUsage(userId, 'blog_posts');

    res.json({
      success: true,
      blogPost: {
        id: blogPost.id,
        title: metadata.title || 'Blog Post',
        content: blogPost.content,
        targetKeyword: blogPost.target_keyword,
        createdAt: blogPost.created_at,
      },
      metadata: {
        metaDescription: metadata.meta_description || `About ${topic}`,
        suggestedKeywords: metadata.keywords || [topic],
      },
    });

  } catch (error) {
    console.error('Blog generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate blog post',
      message: error.message,
    });
  }
});

/**
 * GET /api/blog
 * Get all blog posts for user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, status } = req.query;

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: posts, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        targetKeyword: post.target_keyword,
        status: post.status,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });

  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/blog/:id
 * Get single blog post
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    res.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        targetKeyword: post.target_keyword,
        status: post.status,
        generatedAt: post.generated_at,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      },
    });

  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/blog/:id
 * Update blog post
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content, status } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (status) updateData.status = status;

    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    res.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        status: post.status,
        updatedAt: post.updated_at,
      },
    });

  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/blog/:id
 * Delete blog post
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Blog post deleted',
    });

  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/blog/usage/stats
 * Get usage statistics
 */
router.get('/usage/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: userMeta, error } = await supabase
      .from('user_metadata')
      .select('blog_posts_used, blog_posts_limit, blog_posts_reset_date')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      usage: {
        used: userMeta.blog_posts_used,
        limit: userMeta.blog_posts_limit,
        remaining: userMeta.blog_posts_limit === -1 
          ? 'unlimited' 
          : Math.max(0, userMeta.blog_posts_limit - userMeta.blog_posts_used),
        resetDate: userMeta.blog_posts_reset_date,
      },
    });

  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;