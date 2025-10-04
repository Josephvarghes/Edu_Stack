// src/models/Payout.js
import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ['bank_transfer', 'paypal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  bankAccount: { type: String, default: '' },
  paypalEmail: { type: String, default: '' }
}, {
  timestamps: true
});

export default mongoose.model('Payout', payoutSchema);