const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ['exam', 'assignment', 'deadline', 'study'],
      default: 'deadline',
    },
    date: {
      type: Date,
      required: true,
    },
    weightPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Calendar queries are by user within a date range.
calendarEventSchema.index({ userId: 1, date: 1 });

calendarEventSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
