const express = require('express');
const router = express.Router();
const {
  getWishlist,
  toggleWishlist,
  getWishlistIds,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWishlist);
router.get('/ids', protect, getWishlistIds);
router.post('/toggle/:productId', protect, toggleWishlist);

module.exports = router;
