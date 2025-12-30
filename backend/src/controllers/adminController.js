const User = require('../models/User');
const aiService = require('../services/aiService');

exports.getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      openai_configured: aiService.isConfigured('openai'),
      gemini_configured: aiService.isConfigured('gemini'),
      ai_provider_preference: user.ai_provider_preference || 'auto',
      openai_model: user.openai_model || 'gpt-4',
      gemini_model: user.gemini_model || 'gemini-pro',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { ai_provider_preference, openai_model, gemini_model } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (ai_provider_preference) {
      user.ai_provider_preference = ai_provider_preference;
    }
    if (openai_model) {
      user.openai_model = openai_model;
    }
    if (gemini_model) {
      user.gemini_model = gemini_model;
    }
    
    await user.save();
    
    res.json({
      openai_configured: aiService.isConfigured('openai'),
      gemini_configured: aiService.isConfigured('gemini'),
      ai_provider_preference: user.ai_provider_preference,
      openai_model: user.openai_model,
      gemini_model: user.gemini_model,
    });
  } catch (error) {
    next(error);
  }
};

