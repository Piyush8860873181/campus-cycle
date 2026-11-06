const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getMyListings,
  getHomepageHighlights,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getProducts);
router.get('/homepage/highlights', getHomepageHighlights);
router.get('/my-listings', protect, getMyListings);
router.get('/:id', getProductById);
router.post('/', protect, upload.array('images', 5), createProduct);
router.put('/:id', protect, upload.array('images', 5), updateProduct);
router.patch('/:id/status', protect, updateProductStatus);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
