const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const storage = require('../utils/storageAdapter');

// @desc    Get user's saved wishlist products
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (getIsConnected()) {
      const items = await Wishlist.find({ user: userId })
        .populate({
          path: 'product',
          populate: { path: 'seller', select: 'fullName collegeName avatar' },
        })
        .sort({ createdAt: -1 });

      const products = items.map(i => i.product).filter(Boolean);

      return res.json({
        success: true,
        count: products.length,
        data: products,
      });
    } else {
      const wishDocs = storage.find('wishlists', w => w.user === userId);
      const productIds = wishDocs.map(w => w.product);

      const products = productIds
        .map(id => {
          const p = storage.findById('products', id);
          if (!p) return null;
          let seller = storage.findById('users', p.seller);
          if (seller) {
            const { password, ...safe } = seller;
            seller = safe;
          }
          return { ...p, seller };
        })
        .filter(Boolean);

      return res.json({
        success: true,
        count: products.length,
        data: products,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle product in wishlist (Add/Remove)
// @route   POST /api/wishlist/toggle/:productId
// @access  Private
const toggleWishlist = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    if (getIsConnected()) {
      const existing = await Wishlist.findOne({ user: userId, product: productId });

      if (existing) {
        await Wishlist.findByIdAndDelete(existing._id);
        return res.json({
          success: true,
          inWishlist: false,
          message: 'Item removed from your wishlist.',
        });
      } else {
        await Wishlist.create({ user: userId, product: productId });
        return res.json({
          success: true,
          inWishlist: true,
          message: 'Item saved to your wishlist!',
        });
      }
    } else {
      const existing = storage.findOne('wishlists', w => w.user === userId && w.product === productId);

      if (existing) {
        storage.deleteById('wishlists', existing._id);
        return res.json({
          success: true,
          inWishlist: false,
          message: 'Item removed from your wishlist.',
        });
      } else {
        storage.insert('wishlists', { user: userId, product: productId });
        return res.json({
          success: true,
          inWishlist: true,
          message: 'Item saved to your wishlist!',
        });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get array of product IDs currently in wishlist
// @route   GET /api/wishlist/ids
// @access  Private
const getWishlistIds = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (getIsConnected()) {
      const items = await Wishlist.find({ user: userId }).select('product');
      const ids = items.map(item => item.product.toString());
      return res.json({ success: true, data: ids });
    } else {
      const items = storage.find('wishlists', w => w.user === userId);
      const ids = items.map(item => item.product);
      return res.json({ success: true, data: ids });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
  getWishlistIds,
};
