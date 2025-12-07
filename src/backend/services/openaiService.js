// Lazy load logger to prevent circular dependencies
let logger = null;
try {
  logger = require('../utils/logger');
} catch (error) {
  // Fallback logger if main logger fails
  logger = {
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.log.bind(console),
    debug: console.log.bind(console)
  };
}

// Lazy load OpenAI to prevent crashes if package is not installed
let OpenAI = null;
try {
  OpenAI = require('openai');
} catch (error) {
  if (logger) {
    logger.warn('OpenAI package not installed. AI post generation will be disabled.');
  }
}

class OpenAIService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

    if (!OpenAI) {
      logger.warn('OpenAI package not available. AI post generation will be disabled.');
      this.client = null;
      this.model = model;
      return;
    }

    if (!apiKey) {
      logger.warn('OpenAI API key not configured. AI post generation will be disabled.');
      this.client = null;
      this.model = model;
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey
      });
      this.model = model;
      logger.info('OpenAI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI client:', error);
      this.client = null;
      this.model = model;
    }
  }

  /**
   * Generate a blog post based on a user prompt
   * @param {string} prompt - User's prompt/request for the blog post
   * @param {string} categoryId - Optional category ID (security, iam, ai, compliance)
   * @returns {Promise<Object>} Generated blog post data
   */
  async generateBlogPost(prompt, categoryId = null) {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Build category context
      const categoryContext = this.getCategoryContext(categoryId);
      
      // Create a structured prompt for the AI
      const systemPrompt = `You are an expert cybersecurity and identity management blog writer. 
Your task is to generate high-quality, informative blog posts about cybersecurity, IAM (Identity and Access Management), AI in security, and compliance topics.

Guidelines:
- Write in a professional yet accessible tone
- Include practical insights and real-world examples
- Use proper markdown formatting
- Structure content with clear headings (## for main sections, ### for subsections)
- Include relevant technical details but keep it understandable
- End with a conclusion that summarizes key points
- Generate content that is 800-1500 words
${categoryContext}

Output format (JSON):
{
  "title": "Compelling, SEO-friendly title",
  "content": "Full markdown content with proper formatting",
  "excerpt": "2-3 sentence summary (max 200 characters)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoTitle": "SEO optimized title (max 60 characters)",
  "seoDescription": "SEO meta description (max 160 characters)"
}`;

      const userPrompt = `Please generate a blog post based on the following request:

${prompt}

${categoryId ? `Category: ${this.getCategoryName(categoryId)}` : ''}

Make sure the content is:
- Well-researched and accurate
- Engaging and informative
- Relevant to cybersecurity, IAM, or AI in security
- Properly formatted in markdown
- Includes practical insights and actionable advice`;

      logger.info('Generating blog post with OpenAI', { 
        model: this.model,
        categoryId,
        promptLength: prompt.length 
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const responseContent = completion.choices[0].message.content;
      const generatedData = JSON.parse(responseContent);

      // Validate and clean the generated data
      const cleanedData = this.cleanGeneratedData(generatedData, categoryId);

      logger.info('Blog post generated successfully', { 
        title: cleanedData.title,
        wordCount: cleanedData.content.split(/\s+/).length
      });

      return cleanedData;
    } catch (error) {
      logger.error('Error generating blog post with OpenAI:', {
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to generate blog post: ${error.message}`);
    }
  }

  /**
   * Get category-specific context for the prompt
   */
  getCategoryContext(categoryId) {
    const contexts = {
      'security': 'Focus on cybersecurity topics: threats, vulnerabilities, defense strategies, security best practices, incident response, threat intelligence.',
      'iam': 'Focus on Identity and Access Management: authentication, authorization, SSO, MFA, RBAC, identity governance, access control, directory services.',
      'ai': 'Focus on AI in cybersecurity: machine learning for security, AI-powered threat detection, automated security, AI ethics in security, security automation.',
      'compliance': 'Focus on compliance and governance: GDPR, HIPAA, SOC 2, PCI DSS, regulatory requirements, audit, risk management, data protection.'
    };

    return categoryId && contexts[categoryId] 
      ? `Category focus: ${contexts[categoryId]}` 
      : 'Cover topics across cybersecurity, IAM, AI in security, or compliance as relevant.';
  }

  /**
   * Get category name from ID
   */
  getCategoryName(categoryId) {
    const names = {
      'security': 'Cybersecurity',
      'iam': 'Identity and Access Management',
      'ai': 'AI in Security',
      'compliance': 'Compliance and Governance'
    };
    return names[categoryId] || 'General Security';
  }

  /**
   * Clean and validate generated data
   */
  cleanGeneratedData(data, categoryId) {
    return {
      title: (data.title || 'Untitled Post').trim(),
      content: (data.content || '').trim(),
      excerpt: (data.excerpt || '').trim().substring(0, 200),
      tags: Array.isArray(data.tags) 
        ? data.tags.slice(0, 5).map(tag => tag.trim().toLowerCase())
        : [],
      seoTitle: (data.seoTitle || data.title || 'Untitled Post').trim().substring(0, 60),
      seoDescription: (data.seoDescription || data.excerpt || '').trim().substring(0, 160),
      categoryId: categoryId || null
    };
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured() {
    return this.client !== null;
  }
}

module.exports = new OpenAIService();

