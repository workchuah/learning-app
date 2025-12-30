const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    goal: { type: String, required: true },
    target_timeline: { type: String, required: true }, // e.g., "4 weeks", "2 months"
    outline_file: { type: String, default: '' }, // Path to uploaded PDF/TXT/MD file
    outline_text: { type: String, default: '' }, // Extracted text from outline file
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'generating', 'ready', 'completed'], default: 'draft' },
    progress_percentage: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Course', CourseSchema);

