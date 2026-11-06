const Product = require('../models/Product');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const storage = require('../utils/storageAdapter');

// Helper to populate seller object in fallback mode
const enrichWithSeller = (product) => {
  if (!product) return null;
  let seller = null;
  if (typeof product.seller === 'object' && product.seller !== null && product.seller.fullName) {
    seller = product.seller;
  } else {
    const sellerId = product.seller;
    const rawSeller = storage.findById('users', sellerId);
    if (rawSeller) {
      const { password, ...safe } = rawSeller;
      seller = safe;
    }
  }
  return {
    ...product,
    seller: seller || {
      _id: 'unknown',
      fullName: 'Campus Student',
      collegeName: product.collegeName || 'University Campus',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Student',
      isCollegeVerified: true
    }
  };
};

// @desc    Get all products with filtering, search, sorting & pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      college,
      minPrice,
      maxPrice,
      status,
      graduateClearance,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;

    if (getIsConnected()) {
      const query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ];
      }

      if (category && category !== 'All') {
        query.category = category;
      }

      if (condition && condition !== 'All') {
        query.condition = condition;
      }

      if (college && college !== 'All') {
        query.collegeName = { $regex: college, $options: 'i' };
      }

      if (status && status !== 'All') {
        query.status = status;
      } else if (!status) {
        query.status = 'available';
      }

      if (graduateClearance === 'true') {
        query.isGraduateClearance = true;
      }

      if (minPrice || maxPrice) {
        query.sellingPrice = {};
        if (minPrice) query.sellingPrice.$gte = Number(minPrice);
        if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
      }

      let sortOptions = { createdAt: -1 };
      if (sort === 'price_asc') sortOptions = { sellingPrice: 1 };
      if (sort === 'price_desc') sortOptions = { sellingPrice: -1 };
      if (sort === 'popular') sortOptions = { viewsCount: -1 };

      const total = await Product.countDocuments(query);
      const products = await Product.find(query)
        .populate('seller', 'fullName email collegeName course branch academicYear avatar isCollegeVerified')
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      return res.json({
        success: true,
        count: products.length,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        data: products,
      });
    } else {
      // Storage Engine fallback
      let list = storage.find('products');

      // Filter: Search
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }

      // Filter: Category
      if (category && category !== 'All') {
        list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

      // Filter: Condition
      if (condition && condition !== 'All') {
        list = list.filter(p => p.condition === condition);
      }

      // Filter: College
      if (college && college !== 'All') {
        list = list.filter(p => p.collegeName && p.collegeName.toLowerCase().includes(college.toLowerCase()));
      }

      // Filter: Status
      if (status && status !== 'All') {
        list = list.filter(p => p.status === status);
      } else if (!status) {
        list = list.filter(p => p.status === 'available');
      }

      // Filter: Graduate clearance
      if (graduateClearance === 'true') {
        list = list.filter(p => p.isGraduateClearance);
      }

      // Filter: Price
      if (minPrice) {
        list = list.filter(p => p.sellingPrice >= Number(minPrice));
      }
      if (maxPrice) {
        list = list.filter(p => p.sellingPrice <= Number(maxPrice));
      }

      // Sorting
      if (sort === 'price_asc') {
        list.sort((a, b) => a.sellingPrice - b.sellingPrice);
      } else if (sort === 'price_desc') {
        list.sort((a, b) => b.sellingPrice - a.sellingPrice);
      } else if (sort === 'popular') {
        list.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
      } else {
        // default newest
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }

      const total = list.length;
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = list.slice(startIndex, startIndex + limitNum).map(enrichWithSeller);

      return res.json({
        success: true,
        count: paginated.length,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        data: paginated,
      });
    }
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product details and similar items
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const product = await Product.findByIdAndUpdate(
        id,
        { $inc: { viewsCount: 1 } },
        { new: true }
      ).populate('seller', 'fullName email collegeName course branch academicYear contactNumber avatar bio isCollegeVerified createdAt');

      if (!product) {
        return res.status(404).json({ success: false, message: 'Listing not found.' });
      }

      // Similar products
      const similar = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
        status: 'available',
      })
        .populate('seller', 'fullName collegeName avatar')
        .limit(4);

      return res.json({
        success: true,
        data: product,
        similar,
      });
    } else {
      let product = storage.findById('products', id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Listing not found.' });
      }

      // Increment views
      product.viewsCount = (product.viewsCount || 0) + 1;
      storage.updateById('products', id, { viewsCount: product.viewsCount });

      const enriched = enrichWithSeller(product);

      // Similar items
      const similar = storage
        .find('products', p => (p._id !== id) && p.category === product.category && p.status === 'available')
        .slice(0, 4)
        .map(enrichWithSeller);

      return res.json({
        success: true,
        data: enriched,
        similar,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new product listing
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      sellingPrice,
      originalPrice,
      isNegotiable,
      images,
      department,
      meetingLocation,
      contactPreference,
      isGraduateClearance,
    } = req.body;

    if (!title || !description || !category || !condition || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, condition, and selling price are required.',
      });
    }

    const sellerId = req.user._id || req.user.id;
    const collegeName = req.user.collegeName || 'Delhi University';

    let productImages = [];
    if (req.files && req.files.length > 0) {
      productImages = req.files.map(file => `/uploads/${file.filename}`);
    } else if (Array.isArray(images) && images.length > 0) {
      productImages = images;
    } else if (typeof images === 'string' && images.trim()) {
      productImages = [images];
    } else {
      // Default academic item placeholder
      productImages = ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'];
    }

    const productPayload = {
      title,
      description,
      category,
      condition: condition || 'Good',
      sellingPrice: Number(sellingPrice),
      originalPrice: Number(originalPrice) || Number(sellingPrice) * 1.5,
      isNegotiable: isNegotiable === undefined ? true : Boolean(isNegotiable),
      images: productImages,
      seller: sellerId,
      collegeName,
      department: department || req.user.branch || '',
      meetingLocation: meetingLocation || 'Campus Central Library or Student Activity Center',
      contactPreference: contactPreference || 'In-App Chat',
      status: 'available',
      isGraduateClearance: Boolean(isGraduateClearance),
      viewsCount: 0,
      featured: false,
    };

    if (getIsConnected()) {
      const newProduct = await Product.create(productPayload);
      const populated = await Product.findById(newProduct._id).populate('seller', 'fullName email collegeName avatar');

      return res.status(201).json({
        success: true,
        message: 'Product listed successfully on CampusCycle!',
        data: populated,
      });
    } else {
      const newProduct = storage.insert('products', productPayload);
      const enriched = enrichWithSeller(newProduct);

      return res.status(201).json({
        success: true,
        message: 'Product listed successfully on CampusCycle!',
        data: enriched,
      });
    }
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product listing
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    let existingProduct = null;
    if (getIsConnected()) {
      existingProduct = await Product.findById(id);
    } else {
      existingProduct = storage.findById('products', id);
    }

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const productSellerId = (existingProduct.seller._id || existingProduct.seller).toString();
    if (productSellerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only edit your own listings.' });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.seller;

    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    if (updates.sellingPrice) updates.sellingPrice = Number(updates.sellingPrice);
    if (updates.originalPrice) updates.originalPrice = Number(updates.originalPrice);

    if (getIsConnected()) {
      const updated = await Product.findByIdAndUpdate(id, updates, { new: true })
        .populate('seller', 'fullName email collegeName avatar');
      return res.json({
        success: true,
        message: 'Listing updated successfully!',
        data: updated,
      });
    } else {
      const updated = storage.updateById('products', id, updates);
      return res.json({
        success: true,
        message: 'Listing updated successfully!',
        data: enrichWithSeller(updated),
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change listing status (available, reserved, sold)
// @route   PATCH /api/products/:id/status
// @access  Private
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    if (!['available', 'reserved', 'sold'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be available, reserved, or sold.' });
    }

    let existingProduct = null;
    if (getIsConnected()) {
      existingProduct = await Product.findById(id);
    } else {
      existingProduct = storage.findById('products', id);
    }

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const productSellerId = (existingProduct.seller._id || existingProduct.seller).toString();
    if (productSellerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only change status for your own listing.' });
    }

    if (getIsConnected()) {
      const updated = await Product.findByIdAndUpdate(id, { status }, { new: true });
      return res.json({
        success: true,
        message: `Listing marked as ${status}!`,
        data: updated,
      });
    } else {
      const updated = storage.updateById('products', id, { status });
      return res.json({
        success: true,
        message: `Listing marked as ${status}!`,
        data: enrichWithSeller(updated),
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a listing
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    let existingProduct = null;
    if (getIsConnected()) {
      existingProduct = await Product.findById(id);
    } else {
      existingProduct = storage.findById('products', id);
    }

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const productSellerId = (existingProduct.seller._id || existingProduct.seller).toString();
    if (productSellerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. You cannot delete this listing.' });
    }

    if (getIsConnected()) {
      await Product.findByIdAndDelete(id);
    } else {
      storage.deleteById('products', id);
    }

    res.json({
      success: true,
      message: 'Listing removed successfully from CampusCycle.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get listings created by the logged in student
// @route   GET /api/products/my-listings
// @access  Private
const getMyListings = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (getIsConnected()) {
      const listings = await Product.find({ seller: userId }).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: listings.length,
        data: listings,
      });
    } else {
      const listings = storage
        .find('products', p => (p.seller === userId || (p.seller && p.seller._id === userId)))
        .map(enrichWithSeller);

      return res.json({
        success: true,
        count: listings.length,
        data: listings,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get homepage collections (Featured, Recent, Graduate Clearance)
// @route   GET /api/products/homepage/highlights
// @access  Public
const getHomepageHighlights = async (req, res) => {
  try {
    if (getIsConnected()) {
      const featured = await Product.find({ featured: true, status: 'available' })
        .populate('seller', 'fullName collegeName avatar')
        .limit(6);

      const recent = await Product.find({ status: 'available' })
        .populate('seller', 'fullName collegeName avatar')
        .sort({ createdAt: -1 })
        .limit(8);

      const graduateClearance = await Product.find({ isGraduateClearance: true, status: 'available' })
        .populate('seller', 'fullName collegeName avatar')
        .limit(6);

      return res.json({
        success: true,
        data: {
          featured,
          recent,
          graduateClearance,
        },
      });
    } else {
      const all = storage.find('products', p => p.status === 'available').map(enrichWithSeller);
      const featured = all.filter(p => p.featured).slice(0, 6);
      const recent = [...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
      const graduateClearance = all.filter(p => p.isGraduateClearance).slice(0, 6);

      return res.json({
        success: true,
        data: {
          featured: featured.length > 0 ? featured : all.slice(0, 4),
          recent,
          graduateClearance,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getMyListings,
  getHomepageHighlights,
};
