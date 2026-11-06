const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reason: {
    type: String,
    enum: ['Fake Product', 'Misleading Description', 'Suspicious Seller', 'Inappropriate Listing', 'Scam / Overpriced', 'Other'],
    required: true,
  },
  details: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
