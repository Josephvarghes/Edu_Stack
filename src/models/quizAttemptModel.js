// src/models/QuizAttempt.js
import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number, // percentage (0-100)
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  earnedPoints: {
    type: Number,
    default: 0
  },
  answeredCount: {
    type: Number,
    default: 0
  },
  unansweredCount: {
    type: Number,
    default: 0
  },
  answers: [
    {
      questionIndex: { 
        type: Number, 
        required: true 
      },
      selectedOptionIndex: { 
        type: Number 
      },
      isCorrect: { 
        type: Boolean 
      },
      timeSpent: { 
        type: Number, // seconds
        default: 0
      },
      isSavedForReview: { 
        type: Boolean, 
        default: false 
      },
      isDraft: {
        type: Boolean,
        default: false
      }
    }
  ]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
quizAttemptSchema.index({ userId: 1, quizId: 1 });
quizAttemptSchema.index({ quizId: 1, isCompleted: 1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);