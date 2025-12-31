const User = require('../models/User');
const aiService = require('../services/aiService');

exports.getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Check if API keys are configured for each agent
    const courseStructureKeys = user.api_keys?.course_structure_agent || {};
    const contentGenKeys = user.api_keys?.content_generation_agent || {};
    
    res.json({
      // Global status (from env vars - fallback)
      openai_configured: aiService.isConfigured('openai'),
      gemini_configured: aiService.isConfigured('gemini'),
      // User preferences
      ai_provider_preference: user.ai_provider_preference || 'auto',
      openai_model: user.openai_model || 'gpt-4',
      gemini_model: user.gemini_model || 'gemini-pro',
      // API keys status (only show if configured, never show actual keys)
      api_keys: {
        course_structure_agent: {
          openai_configured: !!courseStructureKeys.openai_key,
          gemini_configured: !!courseStructureKeys.gemini_key,
        },
        content_generation_agent: {
          openai_configured: !!contentGenKeys.openai_key,
          gemini_configured: !!contentGenKeys.gemini_key,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { 
      ai_provider_preference, 
      openai_model, 
      gemini_model,
      api_keys 
    } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Update preferences
    if (ai_provider_preference !== undefined) {
      user.ai_provider_preference = ai_provider_preference;
    }
    if (openai_model) {
      user.openai_model = openai_model;
    }
    if (gemini_model) {
      user.gemini_model = gemini_model;
    }
    
    // Update API keys (only if provided)
    if (api_keys) {
      if (!user.api_keys) {
        user.api_keys = {};
      }
      
      // Course Structure Agent keys
      if (api_keys.course_structure_agent) {
        if (!user.api_keys.course_structure_agent) {
          user.api_keys.course_structure_agent = {};
        }
        if (api_keys.course_structure_agent.openai_key !== undefined) {
          user.api_keys.course_structure_agent.openai_key = api_keys.course_structure_agent.openai_key || '';
        }
        if (api_keys.course_structure_agent.gemini_key !== undefined) {
          user.api_keys.course_structure_agent.gemini_key = api_keys.course_structure_agent.gemini_key || '';
        }
      }
      
      // Content Generation Agent keys
      if (api_keys.content_generation_agent) {
        if (!user.api_keys.content_generation_agent) {
          user.api_keys.content_generation_agent = {};
        }
        if (api_keys.content_generation_agent.openai_key !== undefined) {
          user.api_keys.content_generation_agent.openai_key = api_keys.content_generation_agent.openai_key || '';
        }
        if (api_keys.content_generation_agent.gemini_key !== undefined) {
          user.api_keys.content_generation_agent.gemini_key = api_keys.content_generation_agent.gemini_key || '';
        }
      }
    }
    
    await user.save();
    
    // Return updated settings (without showing actual keys)
    const courseStructureKeys = user.api_keys?.course_structure_agent || {};
    const contentGenKeys = user.api_keys?.content_generation_agent || {};
    
    res.json({
      openai_configured: aiService.isConfigured('openai'),
      gemini_configured: aiService.isConfigured('gemini'),
      ai_provider_preference: user.ai_provider_preference,
      openai_model: user.openai_model,
      gemini_model: user.gemini_model,
      api_keys: {
        course_structure_agent: {
          openai_configured: !!courseStructureKeys.openai_key,
          gemini_configured: !!courseStructureKeys.gemini_key,
        },
        content_generation_agent: {
          openai_configured: !!contentGenKeys.openai_key,
          gemini_configured: !!contentGenKeys.gemini_key,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

