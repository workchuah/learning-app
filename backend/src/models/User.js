const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    display_name: { type: String, default: '' },
    profile_picture: { type: String, default: '' },
    ai_provider_preference: { type: String, enum: ['openai', 'gemini', 'auto'], default: 'auto' },
    openai_model: { type: String, default: 'gpt-4' },
    gemini_model: { type: String, default: 'gemini-pro' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);

