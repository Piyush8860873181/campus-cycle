const Category = require('../models/Category');
const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const storage = require('../utils/storageAdapter');
const { categoriesData } = require('../utils/seedData');

// @desc    Get all categories with active item counts
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    if (getIsConnected()) {
      const categories = await Category.find().sort({ name: 1 });

      // Calculate dynamic counts
      const enriched = await Promise.all(
        categories.map(async (cat) => {
          const count = await Product.countDocuments({ category: cat.name, status: 'available' });
          return {
            ...cat.toObject(),
            itemCount: count,
          };
        })
      );

      return res.json({
        success: true,
        data: enriched,
      });
    } else {
      const categories = storage.find('categories');
      const products = storage.find('products', p => p.status === 'available');

      const enriched = categories.map(cat => ({
        ...cat,
        itemCount: products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length,
      }));

      return res.json({
        success: true,
        data: enriched,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCategories };
