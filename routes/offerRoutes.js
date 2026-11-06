const express = require('express');
const router = express.Router();
const {
  createOffer,
  getMyOffers,
  respondToOffer,
} = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createOffer);
router.get('/', protect, getMyOffers);
router.patch('/:id/respond', protect, respondToOffer);

module.exports = router;
