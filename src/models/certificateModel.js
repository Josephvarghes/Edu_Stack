// src/models/Certificate.js
import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
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
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['Mathematics', 'Science', 'Programming', 'Business', 'Art', 'Other']
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  achievementLevel: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  verificationCode: {
    type: String,
    unique: true,
    required: true
  },
  shareUrl: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  skillsEarned: [String],
  studyTimeHours: {
    type: Number,
    default: 0
  },
  chaptersCompleted: {
    type: Number,
    default: 0
  },
  quizzesPassed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
certificateSchema.index({ userId: 1, completionDate: -1 });
certificateSchema.index({ verificationCode: 1 });

export default mongoose.model('Certificate', certificateSchema);