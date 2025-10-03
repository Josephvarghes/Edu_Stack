import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    completedLessons: {
      type: Number,
      default: 0,
    },
    totalLessons: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-calc percentage before save
progressSchema.pre('save', function (next) {
  if (this.totalLessons > 0) {
    this.percentage = Math.min(
      (this.completedLessons / this.totalLessons) * 100,
      100
    );
  }
  next();
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
