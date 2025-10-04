// src/models/TutorStats.js
import mongoose from 'mongoose';

const tutorStatsSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    unique: true
  },
  coursesUploaded: { type: Number, default: 0 },
  studentsEnrolled: { type: Number, default: 0 },
  earningsThisMonth: { type: Number, default: 0 },
  averageCompletionRate: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  studentReviews: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model('TutorStats', tutorStatsSchema);