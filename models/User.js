const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  collegeName: {
    type: String,
    required: [true, 'College / University name is required'],
    trim: true,
  },
  course: {
    type: String,
    default: 'B.Tech',
    trim: true,
  },
  branch: {
    type: String,
    default: 'Computer Science & Engineering',
    trim: true,
  },
  academicYear: {
    type: String,
    default: '3rd Year',
    trim: true,
  },
  contactNumber: {
    type: String,
    default: '',
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: 'Student excited to share and reuse campus essentials.',
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isCollegeVerified: {
    type: Boolean,
    default: false,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
