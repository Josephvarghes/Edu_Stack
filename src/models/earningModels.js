// src/models/Earning.js
import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ['course_sale', 'certificate_fee', 'live_session'],
    required: true
  },
  sourceId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Earning', earningSchema);