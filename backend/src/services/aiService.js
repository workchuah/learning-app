const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  // Create OpenAI client with specific API key
  createOpenAIClient(apiKey) {
    if (!apiKey) return null;
    return new OpenAI({ apiKey: apiKey });
  }

  // Create Gemini client with specific API key
  createGeminiClient(apiKey) {
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt, provider = 'auto', model = null, openaiKey = null, geminiKey = null) {
    const openai = this.createOpenAIClient(openaiKey || process.env.OPENAI_API_KEY);
    const gemini = this.createGeminiClient(geminiKey || process.env.GEMINI_API_KEY);

    if (provider === 'auto') {
      // Try OpenAI first, fallback to Gemini
      if (openai) {
        try {
          return await this.generateOpenAI(prompt, model || 'gpt-4', openai);
        } catch (error) {
          console.warn('OpenAI failed, trying Gemini:', error.message);
          if (gemini) {
            return await this.generateGemini(prompt, model || 'gemini-pro', gemini);
          }
          throw new Error('No AI provider available');
        }
      } else if (gemini) {
        return await this.generateGemini(prompt, model || 'gemini-pro', gemini);
      } else {
        throw new Error('No AI provider configured');
      }
    } else if (provider === 'openai') {
      if (!openai) throw new Error('OpenAI not configured');
      return await this.generateOpenAI(prompt, model || 'gpt-4', openai);
    } else if (provider === 'gemini') {
      if (!gemini) throw new Error('Gemini not configured');
      return await this.generateGemini(prompt, model || 'gemini-pro', gemini);
    }
  }

  async generateOpenAI(prompt, model = 'gpt-4', openaiClient = null) {
    const client = openaiClient || this.createOpenAIClient(process.env.OPENAI_API_KEY);
    if (!client) throw new Error('OpenAI client not available');
    
    const response = await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  }

  async generateGemini(prompt, model = 'gemini-pro', geminiClient = null) {
    const client = geminiClient || this.createGeminiClient(process.env.GEMINI_API_KEY);
    if (!client) throw new Error('Gemini client not available');
    
    const genModel = client.getGenerativeModel({ model: model });
    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  isConfigured(provider, openaiKey = null, geminiKey = null) {
    const hasOpenAI = !!(openaiKey || process.env.OPENAI_API_KEY);
    const hasGemini = !!(geminiKey || process.env.GEMINI_API_KEY);
    
    if (provider === 'openai') return hasOpenAI;
    if (provider === 'gemini') return hasGemini;
    return hasOpenAI || hasGemini;
  }
}

module.exports = new AIService();

