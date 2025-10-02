import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: false
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  tag: {
    type: String,
    enum: ['Key Concept', 'Formula', 'Insight', 'Question'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
noteSchema.index({ userId: 1, courseId: 1 });
noteSchema.index({ courseId: 1, isPublic: 1 });

export default mongoose.model('Note', noteSchema);