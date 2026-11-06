const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report');
const Offer = require('../models/Offer');
const { getIsConnected } = require('../config/db');
const storage = require('../utils/storageAdapter');

// @desc    Get Admin Metrics & Analytics
// @route   GET /api/admin/metrics
// @access  Private/Admin
const getAdminMetrics = async (req, res) => {
  try {
    if (getIsConnected()) {
      const totalUsers = await User.countDocuments();
      const verifiedUsers = await User.countDocuments({ isCollegeVerified: true });
      const totalProducts = await Product.countDocuments();
      const activeProducts = await Product.countDocuments({ status: 'available' });
      const soldProducts = await Product.countDocuments({ status: 'sold' });
      const pendingReports = await Report.countDocuments({ status: 'pending' });
      const totalOffers = await Offer.countDocuments();

      return res.json({
        success: true,
        data: {
          totalUsers,
          verifiedUsers,
          totalProducts,
          activeProducts,
          soldProducts,
          pendingReports,
          totalOffers,
        },
      });
    } else {
      const users = storage.find('users');
      const products = storage.find('products');
      const reports = storage.find('reports');
      const offers = storage.find('offers');

      return res.json({
        success: true,
        data: {
          totalUsers: users.length,
          verifiedUsers: users.filter(u => u.isCollegeVerified).length,
          totalProducts: products.length,
          activeProducts: products.filter(p => p.status === 'available').length,
          soldProducts: products.filter(p => p.status === 'sold').length,
          pendingReports: reports.filter(r => r.status === 'pending').length,
          totalOffers: offers.length,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (with search and filter)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { search, college, role } = req.query;

    if (getIsConnected()) {
      const query = {};
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
      if (college && college !== 'All') {
        query.collegeName = { $regex: college, $options: 'i' };
      }
      if (role && role !== 'All') {
        query.role = role;
      }

      const users = await User.find(query).select('-password').sort({ createdAt: -1 });
      return res.json({ success: true, count: users.length, data: users });
    } else {
      let users = storage.find('users');
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      if (college && college !== 'All') {
        users = users.filter(u => u.collegeName && u.collegeName.toLowerCase().includes(college.toLowerCase()));
      }
      if (role && role !== 'All') {
        users = users.filter(u => u.role === role);
      }

      const safe = users.map(u => {
        const { password, ...s } = u;
        return s;
      });

      return res.json({ success: true, count: safe.length, data: safe });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user suspension
// @route   PATCH /api/admin/users/:id/suspend
// @access  Private/Admin
const toggleUserSuspension = async (req, res) => {
  try {
    const { id } = req.params;

    let user = null;
    if (getIsConnected()) {
      user = await User.findById(id);
    } else {
      user = storage.findById('users', id);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const newSuspensionStatus = !user.isSuspended;

    if (getIsConnected()) {
      const updated = await User.findByIdAndUpdate(id, { isSuspended: newSuspensionStatus }, { new: true }).select('-password');
      return res.json({
        success: true,
        message: newSuspensionStatus ? 'User account has been suspended.' : 'User account has been reactivated.',
        data: updated,
      });
    } else {
      const updated = storage.updateById('users', id, { isSuspended: newSuspensionStatus });
      const { password, ...safe } = updated;
      return res.json({
        success: true,
        message: newSuspensionStatus ? 'User account has been suspended.' : 'User account has been reactivated.',
        data: safe,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit a report on a product or user
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const { productId, reportedUserId, reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please select a reason for the report.' });
    }

    const payload = {
      reportedBy: userId,
      product: productId || null,
      reportedUser: reportedUserId || null,
      reason,
      details: details || '',
      status: 'pending'
    };

    if (getIsConnected()) {
      const report = await Report.create(payload);
      return res.status(201).json({
        success: true,
        message: 'Thank you for your report. Our campus moderation team has been notified.',
        data: report
      });
    } else {
      const report = storage.insert('reports', payload);
      return res.status(201).json({
        success: true,
        message: 'Thank you for your report. Our campus moderation team has been notified.',
        data: report
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAllReports = async (req, res) => {
  try {
    if (getIsConnected()) {
      const reports = await Report.find()
        .populate('reportedBy', 'fullName email collegeName')
        .populate('product', 'title sellingPrice images status seller')
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: reports.length, data: reports });
    } else {
      const reports = storage.find('reports').map(r => {
        let reportedBy = storage.findById('users', r.reportedBy);
        let product = r.product ? storage.findById('products', r.product) : null;
        return {
          ...r,
          reportedBy,
          product
        };
      });

      return res.json({ success: true, count: reports.length, data: reports });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve or dismiss a report
// @route   PATCH /api/admin/reports/:id
// @access  Private/Admin
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status.' });
    }

    if (getIsConnected()) {
      const updated = await Report.findByIdAndUpdate(id, { status }, { new: true });
      return res.json({ success: true, message: `Report marked as ${status}.`, data: updated });
    } else {
      const updated = storage.updateById('reports', id, { status });
      return res.json({ success: true, message: `Report marked as ${status}.`, data: updated });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminMetrics,
  getAllUsers,
  toggleUserSuspension,
  createReport,
  getAllReports,
  updateReportStatus,
};
