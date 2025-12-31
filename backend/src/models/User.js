const mongoose = require('mongoose');

// Schema for API keys per agent
const AgentApiKeysSchema = new mongoose.Schema(
  {
    openai_key: { type: String, default: '' },
    gemini_key: { type: String, default: '' },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    display_name: { type: String, default: '' },
    profile_picture: { type: String, default: '' },
    ai_provider_preference: { type: String, enum: ['openai', 'gemini', 'auto'], default: 'auto' },
    openai_model: { type: String, default: 'gpt-4' },
    gemini_model: { type: String, default: 'gemini-pro' },
    // API keys for each AI agent
    api_keys: {
      course_structure_agent: { type: AgentApiKeysSchema, default: () => ({}) },
      content_generation_agent: { type: AgentApiKeysSchema, default: () => ({}) },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);

