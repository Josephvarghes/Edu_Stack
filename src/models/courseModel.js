
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  thumbnail: {
    type: String,
    default: null
  },
  syllabus: [{
    type: String,
    trim: true
  }],
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Math', 'Science', 'Programming', 'Business', 'Art', 'Other']
  },
  tags: [String],
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: isFree
courseSchema.virtual('isFree').get(function() {
  return this.price === 0;
});

export default mongoose.model('Course', courseSchema);