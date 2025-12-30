const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    type: { type: String, enum: ['course', 'module', 'topic'], required: true },
    completed: { type: Boolean, default: false },
    completed_at: { type: Date, default: null },
    quiz_score: { type: Number, default: null }, // Percentage score
    quiz_attempts: [{
      score: Number,
      submitted_at: Date,
      answers: mongoose.Schema.Types.Mixed,
    }],
    last_accessed_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

ProgressSchema.index({ user_id: 1, course_id: 1 });
ProgressSchema.index({ user_id: 1, topic_id: 1 });

module.exports = mongoose.model('Progress', ProgressSchema);

