const express = require('express');
const router = express.Router();
const {
  getAdminMetrics,
  getAllUsers,
  toggleUserSuspension,
  createReport,
  getAllReports,
  updateReportStatus,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Report creation is open to any authenticated student
router.post('/reports', protect, createReport);

// All other endpoints are admin only
router.get('/metrics', protect, adminOnly, getAdminMetrics);
router.get('/users', protect, adminOnly, getAllUsers);
router.patch('/users/:id/suspend', protect, adminOnly, toggleUserSuspension);
router.get('/reports', protect, adminOnly, getAllReports);
router.patch('/reports/:id', protect, adminOnly, updateReportStatus);

module.exports = router;
