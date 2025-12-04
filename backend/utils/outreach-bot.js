import supabase from '../config/supabase.js';

/**
 * Get outreach opportunities for a user
 */
export const getOutreachOpportunities = async (userId) => {
  try {
    const { data: sources, error } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', userId)
      .eq('outreach_status', 'not_contacted')
      .order('mentions_count', { ascending: false });

    if (error) throw error;

    return sources || [];
  } catch (error) {
    console.error('Get outreach opportunities error:', error);
    return [];
  }
};

/**
 * Update outreach status
 */
export const updateOutreachStatus = async (sourceId, status, notes = '') => {
  try {
    const { data, error } = await supabase
      .from('sources')
      .update({
        outreach_status: status,
        outreach_notes: notes,
        contacted_at: status === 'contacted' ? new Date().toISOString() : null,
      })
      .eq('id', sourceId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Update outreach status error:', error);
    throw error;
  }
};

/**
 * Generate outreach email template
 */
export const generateOutreachTemplate = async (source, userCompany) => {
  const template = `
Subject: Content Collaboration - ${userCompany}

Hi ${source.author},

I came across your recent article on ${source.title} and found it incredibly valuable.

As someone working in the same space with ${userCompany}, I thought you might be interested in collaborating on content that explores this topic further.

Would you be open to a quick 15-minute call to discuss potential opportunities?

Looking forward to connecting!

Best regards,
[Your Name]
${userCompany}
  `.trim();

  return template;
};

/**
 * Track outreach campaign metrics
 */
export const getOutreachMetrics = async (userId) => {
  try {
    const { data: sources } = await supabase
      .from('sources')
      .select('outreach_status')
      .eq('user_id', userId);

    if (!sources) return null;

    return {
      total: sources.length,
      notContacted: sources.filter(s => s.outreach_status === 'not_contacted').length,
      contacted: sources.filter(s => s.outreach_status === 'contacted').length,
      responded: sources.filter(s => s.outreach_status === 'responded').length,
      ignored: sources.filter(s => s.outreach_status === 'ignored').length,
      responseRate: sources.length > 0 
        ? ((sources.filter(s => s.outreach_status === 'responded').length / sources.length) * 100).toFixed(2) + '%'
        : '0%',
    };
  } catch (error) {
    console.error('Get outreach metrics error:', error);
    return null;
  }
};

export default {
  getOutreachOpportunities,
  updateOutreachStatus,
  generateOutreachTemplate,
  getOutreachMetrics,
};