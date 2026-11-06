const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const storage = require('../utils/storageAdapter');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      collegeName,
      course,
      branch,
      academicYear,
      contactNumber,
      avatar,
      bio
    } = req.body;

    if (!fullName || !email || !password || !collegeName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, password, and college name.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if college email domain (.edu, .ac.in, or similar)
    const isAcademicEmail = /\.(edu|ac\.in|edu\.in|ernet\.in)$/i.test(normalizedEmail);

    if (getIsConnected()) {
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        fullName,
        email: normalizedEmail,
        password: hashedPassword,
        collegeName,
        course: course || 'B.Tech',
        branch: branch || 'Computer Science & Engineering',
        academicYear: academicYear || '1st Year',
        contactNumber: contactNumber || '',
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        bio: bio || 'Student on CampusCycle.',
        role: 'user',
        isCollegeVerified: isAcademicEmail,
      });

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          collegeName: user.collegeName,
          course: user.course,
          branch: user.branch,
          academicYear: user.academicYear,
          contactNumber: user.contactNumber,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          isCollegeVerified: user.isCollegeVerified,
          token: generateToken(user._id),
        },
      });
    } else {
      // Storage fallback
      const userExists = storage.findOne('users', u => u.email.toLowerCase() === normalizedEmail);
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = storage.insert('users', {
        fullName,
        email: normalizedEmail,
        password: hashedPassword,
        collegeName,
        course: course || 'B.Tech',
        branch: branch || 'Computer Science & Engineering',
        academicYear: academicYear || '1st Year',
        contactNumber: contactNumber || '',
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        bio: bio || 'Student on CampusCycle.',
        role: 'user',
        isCollegeVerified: isAcademicEmail,
        isSuspended: false
      });

      const { password: _, ...safeUser } = newUser;

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        data: {
          ...safeUser,
          token: generateToken(newUser._id),
        },
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    let isMatch = false;

    if (getIsConnected()) {
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    } else {
      user = storage.findOne('users', u => u.email.toLowerCase() === normalizedEmail);
      if (user) {
        isMatch = bcrypt.compareSync(password, user.password);
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact administrator.' });
    }

    const { password: _, ...userData } = user.toObject ? user.toObject() : user;

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        ...userData,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      fullName,
      collegeName,
      course,
      branch,
      academicYear,
      contactNumber,
      avatar,
      bio
    } = req.body;

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (collegeName) updates.collegeName = collegeName;
    if (course) updates.course = course;
    if (branch) updates.branch = branch;
    if (academicYear) updates.academicYear = academicYear;
    if (contactNumber !== undefined) updates.contactNumber = contactNumber;
    if (avatar) updates.avatar = avatar;
    if (bio !== undefined) updates.bio = bio;

    let updatedUser = null;

    if (getIsConnected()) {
      updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    } else {
      updatedUser = storage.updateById('users', userId, updates);
      if (updatedUser) {
        const { password, ...safe } = updatedUser;
        updatedUser = safe;
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request/Toggle college verification
// @route   POST /api/auth/verify-college
// @access  Private
const verifyCollege = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { studentIdCardNumber } = req.body;

    const updates = { isCollegeVerified: true };
    let updatedUser;

    if (getIsConnected()) {
      updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    } else {
      updatedUser = storage.updateById('users', userId, updates);
    }

    res.json({
      success: true,
      message: 'Campus student identity verified successfully!',
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  verifyCollege,
};
