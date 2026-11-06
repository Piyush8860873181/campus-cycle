const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  condition: {
    type: String,
    enum: ['Brand New', 'Like New', 'Good', 'Fair'],
    required: [true, 'Condition is required'],
    default: 'Good',
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: 0,
  },
  originalPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  isNegotiable: {
    type: Boolean,
    default: true,
  },
  images: [{
    type: String,
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collegeName: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    default: '',
    trim: true,
  },
  meetingLocation: {
    type: String,
    default: 'Campus Central Library or Student Activity Center',
    trim: true,
  },
  contactPreference: {
    type: String,
    enum: ['In-App Chat', 'Phone', 'WhatsApp'],
    default: 'In-App Chat',
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold'],
    default: 'available',
  },
  isGraduateClearance: {
    type: Boolean,
    default: false,
  },
  viewsCount: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
