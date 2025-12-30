const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.openai = null;
    this.gemini = null;
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async generate(prompt, provider = 'auto', model = null) {
    if (provider === 'auto') {
      // Try OpenAI first, fallback to Gemini
      if (this.openai) {
        try {
          return await this.generateOpenAI(prompt, model || 'gpt-4');
        } catch (error) {
          console.warn('OpenAI failed, trying Gemini:', error.message);
          if (this.gemini) {
            return await this.generateGemini(prompt, model || 'gemini-pro');
          }
          throw new Error('No AI provider available');
        }
      } else if (this.gemini) {
        return await this.generateGemini(prompt, model || 'gemini-pro');
      } else {
        throw new Error('No AI provider configured');
      }
    } else if (provider === 'openai') {
      if (!this.openai) throw new Error('OpenAI not configured');
      return await this.generateOpenAI(prompt, model || 'gpt-4');
    } else if (provider === 'gemini') {
      if (!this.gemini) throw new Error('Gemini not configured');
      return await this.generateGemini(prompt, model || 'gemini-pro');
    }
  }

  async generateOpenAI(prompt, model = 'gpt-4') {
    const response = await this.openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  }

  async generateGemini(prompt, model = 'gemini-pro') {
    const genModel = this.gemini.getGenerativeModel({ model: model });
    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  isConfigured(provider) {
    if (provider === 'openai') return !!this.openai;
    if (provider === 'gemini') return !!this.gemini;
    return !!this.openai || !!this.gemini;
  }
}

module.exports = new AIService();

