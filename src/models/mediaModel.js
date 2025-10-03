import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['video', 'pdf', 'image'],
    required: true
  },
  publicId: {
    type: String, 
    required: true
  },
   resourceType: {        
    type: String,
    enum: ['video', 'raw', 'image'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  pages: {
    type: Number, // for PDFs
    default: 0
  },
  size: {
    type: Number, // in bytes
    default: 0
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.model('Media', mediaSchema);