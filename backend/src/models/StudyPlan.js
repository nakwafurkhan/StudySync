const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Snapshot of the subjects the plan was generated from.
    subjects: [
      {
        name: String,
        deadline: Date,
        priority: String,
      },
    ],
    dailyHours: {
      type: Number,
      required: true,
    },
    // The validated day-by-day schedule from OpenAI (or the fallback).
    generatedSchedule: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: String,
      enum: ['openai', 'fallback'],
      default: 'openai',
    },
  },
  { timestamps: true }
);

// Frequent query: a user's most recent plan.
studyPlanSchema.index({ userId: 1, createdAt: -1 });

studyPlanSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
