import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Free', 'Premium', 'Pro']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'RS'
  },
  duration: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  features: [String],
  isPopular: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.model('Plan', planSchema);