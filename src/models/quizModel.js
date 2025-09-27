import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  // Core quiz info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
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
  
  // Quiz settings
  timeLimit: {
    type: Number, // in minutes
    required: true,
    min: 1,
    max: 180
  },
  passingScore: {
    type: Number, // percentage (e.g., 70)
    required: true,
    min: 0,
    max: 100
  },
  attemptsAllowed: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Questions (embedded array)
  questions: [
    {
      question: {
        type: String,
        required: true,
        maxlength: 500
      },
      options: {
        type: [String], // ["Option A", "Option B", ...]
        required: true,
        validate: [array => array.length >= 2, 'At least 2 options required']
      },
      correctAnswer: {
        type: Number, // index of correct option (0, 1, 2, 3)
        required: true,
        min: 0,
        validate: {
          validator: function(value) {
            return value < this.options.length;
          },
          message: 'Correct answer index must be within options range'
        }
      }
    }
  ],

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
quizSchema.index({ courseId: 1, isActive: 1 });
quizSchema.index({ createdBy: 1 });

export default mongoose.model('Quiz', quizSchema);