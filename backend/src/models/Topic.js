const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema(
  {
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    lecture_notes: { type: String, default: '' },
    tutorial_exercises: [{
      question: String,
      answer: String,
    }],
    practical_tasks: [{
      title: String,
      description: String,
      steps: [String],
      completed: { type: Boolean, default: false },
    }],
    quiz: {
      mcq_questions: [{
        question: String,
        options: [String],
        correct_answer: Number, // Index of correct option
        explanation: String,
      }],
      short_answer_questions: [{
        question: String,
        answer: String,
        explanation: String,
      }],
    },
    status: { type: String, enum: ['pending', 'generating', 'ready'], default: 'pending' },
  },
  {
    timestamps: true,
  }
);

TopicSchema.index({ module_id: 1, order: 1 });
TopicSchema.index({ course_id: 1 });

module.exports = mongoose.model('Topic', TopicSchema);

