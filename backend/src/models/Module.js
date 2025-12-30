const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema(
  {
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true },
    progress_percentage: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

ModuleSchema.index({ course_id: 1, order: 1 });

module.exports = mongoose.model('Module', ModuleSchema);

