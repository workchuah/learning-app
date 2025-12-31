const User = require('../models/User');
const aiService = require('../services/aiService');

exports.getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get API keys for each agent (never return actual keys)
    const getAgentStatus = (agentName) => {
      const keys = user.api_keys?.[agentName] || {};
      return {
        provider: keys.provider || 'openai',
        configured: !!keys.api_key,
      };
    };
    
    res.json({
      // Global status (from env vars - fallback)
      openai_configured: aiService.isConfigured('openai'),
      gemini_configured: aiService.isConfigured('gemini'),
      // User preferences
      openai_model: user.openai_model || 'gpt-4',
      gemini_model: user.gemini_model || 'gemini-pro',
      // API keys status (only show if configured, never show actual keys)
      api_keys: {
        course_structure_agent: getAgentStatus('course_structure_agent'),
        content_generation_agent: getAgentStatus('content_generation_agent'),
        tutorial_exercise_agent: getAgentStatus('tutorial_exercise_agent'),
        practical_task_agent: getAgentStatus('practical_task_agent'),
        quiz_agent: getAgentStatus('quiz_agent'),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { 
      openai_model, 
      gemini_model,
      api_keys 
    } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Update model preferences
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
      
      const agentNames = [
        'course_structure_agent',
        'content_generation_agent',
        'tutorial_exercise_agent',
        'practical_task_agent',
        'quiz_agent'
      ];
      
      agentNames.forEach(agentName => {
        if (api_keys[agentName]) {
          if (!user.api_keys[agentName]) {
            user.api_keys[agentName] = {};
          }
          // Update provider if provided
          if (api_keys[agentName].provider !== undefined) {
            user.api_keys[agentName].provider = api_keys[agentName].provider;
          }
          // Only update api_key if it's provided in the request
          // If api_key is not in the request, keep existing value (don't overwrite)
          if (api_keys[agentName].hasOwnProperty('api_key')) {
            // api_key is explicitly provided (could be empty string to clear, or a new value)
            user.api_keys[agentName].api_key = api_keys[agentName].api_key;
          }
          // If api_key is not in the request object, it means user didn't provide it
          // So we keep the existing api_key value unchanged
        }
      });
    }
    
    await user.save();
    
    // Return updated settings (without showing actual keys)
    const getAgentStatus = (agentName) => {
      const keys = user.api_keys?.[agentName] || {};
      return {
        provider: keys.provider || 'openai',
        configured: !!keys.api_key,
      };
    };
    
    res.json({
      openai_configured: aiService.isConfigured('openai'),
      gemini_configured: aiService.isConfigured('gemini'),
      openai_model: user.openai_model,
      gemini_model: user.gemini_model,
      api_keys: {
        course_structure_agent: getAgentStatus('course_structure_agent'),
        content_generation_agent: getAgentStatus('content_generation_agent'),
        tutorial_exercise_agent: getAgentStatus('tutorial_exercise_agent'),
        practical_task_agent: getAgentStatus('practical_task_agent'),
        quiz_agent: getAgentStatus('quiz_agent'),
      },
    });
  } catch (error) {
    next(error);
  }
};

