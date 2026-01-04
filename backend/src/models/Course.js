const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    goal: { 
      type: String, 
      default: '',
      required: false 
    }, // Optional for manual courses
    course_type: { type: String, enum: ['ai_generated', 'manual'], default: 'ai_generated' }, // New field
    target_timeline: { type: String, default: '' }, // Estimated timeline (e.g., "4 weeks", "2 months") - auto-generated
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

// Pre-save hook to ensure goal is always a string (never undefined or null)
CourseSchema.pre('save', function(next) {
  // If goal is undefined or null, set it to empty string
  if (this.goal === undefined || this.goal === null) {
    this.goal = '';
  }
  // Ensure goal is always a string
  if (typeof this.goal !== 'string') {
    this.goal = String(this.goal);
  }
  next();
});

module.exports = mongoose.model('Course', CourseSchema);

