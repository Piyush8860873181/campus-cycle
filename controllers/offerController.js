const Offer = require('../models/Offer');
const Product = require('../models/Product');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const storage = require('../utils/storageAdapter');

// Helper to enrich offer with product and user details
const enrichOffer = (offer) => {
  if (!offer) return null;
  let product = offer.product;
  if (typeof product !== 'object' || !product.title) {
    product = storage.findById('products', product);
  }
  let buyer = offer.buyer;
  if (typeof buyer !== 'object' || !buyer.fullName) {
    const rawBuyer = storage.findById('users', buyer);
    if (rawBuyer) {
      const { password, ...safe } = rawBuyer;
      buyer = safe;
    }
  }
  let seller = offer.seller;
  if (typeof seller !== 'object' || !seller.fullName) {
    const rawSeller = storage.findById('users', seller);
    if (rawSeller) {
      const { password, ...safe } = rawSeller;
      seller = safe;
    }
  }
  return {
    ...offer,
    product,
    buyer,
    seller
  };
};

// @desc    Submit an offer on a product
// @route   POST /api/offers
// @access  Private
const createOffer = async (req, res) => {
  try {
    const { productId, offerPrice, message } = req.body;
    const buyerId = (req.user._id || req.user.id).toString();

    if (!productId || offerPrice === undefined || Number(offerPrice) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product and offer price are required.' });
    }

    let product = null;
    if (getIsConnected()) {
      product = await Product.findById(productId);
    } else {
      product = storage.findById('products', productId);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const sellerId = (product.seller._id || product.seller).toString();
    if (sellerId === buyerId) {
      return res.status(400).json({ success: false, message: 'You cannot make an offer on your own listing.' });
    }

    const offerPayload = {
      product: productId,
      buyer: buyerId,
      seller: sellerId,
      originalPrice: product.sellingPrice,
      offerPrice: Number(offerPrice),
      counterPrice: null,
      message: message || `Offered ₹${offerPrice} for ${product.title}`,
      status: 'pending'
    };

    if (getIsConnected()) {
      const offer = await Offer.create(offerPayload);
      const populated = await Offer.findById(offer._id)
        .populate('product', 'title sellingPrice images status')
        .populate('buyer', 'fullName email avatar collegeName')
        .populate('seller', 'fullName email avatar collegeName');

      return res.status(201).json({
        success: true,
        message: 'Offer submitted successfully to the seller!',
        data: populated
      });
    } else {
      const offer = storage.insert('offers', offerPayload);
      const enriched = enrichOffer(offer);

      return res.status(201).json({
        success: true,
        message: 'Offer submitted successfully to the seller!',
        data: enriched
      });
    }
  } catch (error) {
    console.error('createOffer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's sent and received offers
// @route   GET /api/offers
// @access  Private
const getMyOffers = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (getIsConnected()) {
      const sent = await Offer.find({ buyer: userId })
        .populate('product', 'title sellingPrice images status collegeName')
        .populate('seller', 'fullName email avatar collegeName')
        .sort({ createdAt: -1 });

      const received = await Offer.find({ seller: userId })
        .populate('product', 'title sellingPrice images status collegeName')
        .populate('buyer', 'fullName email avatar collegeName branch academicYear')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: {
          sent,
          received,
        }
      });
    } else {
      const allOffers = storage.find('offers').map(enrichOffer);
      const sent = allOffers.filter(o => {
        const bId = (o.buyer && (o.buyer._id || o.buyer.id || o.buyer)).toString();
        return bId === userId;
      });
      const received = allOffers.filter(o => {
        const sId = (o.seller && (o.seller._id || o.seller.id || o.seller)).toString();
        return sId === userId;
      });

      return res.json({
        success: true,
        data: {
          sent,
          received
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to an offer (accept, reject, counter)
// @route   PATCH /api/offers/:id/respond
// @access  Private
const respondToOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, counterPrice, message } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    if (!['accept', 'reject', 'counter'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept, reject, or counter.' });
    }

    let offer = null;
    if (getIsConnected()) {
      offer = await Offer.findById(id);
    } else {
      offer = storage.findById('offers', id);
    }

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    const sellerId = (offer.seller._id || offer.seller).toString();
    const buyerId = (offer.buyer._id || offer.buyer).toString();

    // Verification: if action is counter/reject/accept by seller
    if (action === 'accept' || action === 'reject') {
      if (sellerId !== userId && buyerId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized to respond to this offer.' });
      }
    }

    let newStatus = offer.status;
    let updates = {};

    if (action === 'accept') {
      newStatus = 'accepted';
      updates.status = 'accepted';
      if (message) updates.message = message;
    } else if (action === 'reject') {
      newStatus = 'rejected';
      updates.status = 'rejected';
      if (message) updates.message = message;
    } else if (action === 'counter') {
      if (sellerId !== userId) {
        return res.status(403).json({ success: false, message: 'Only the seller can make a counter-offer.' });
      }
      if (!counterPrice || Number(counterPrice) <= 0) {
        return res.status(400).json({ success: false, message: 'Please provide a valid counter-offer price.' });
      }
      newStatus = 'countered';
      updates.status = 'countered';
      updates.counterPrice = Number(counterPrice);
      if (message) updates.message = message;
    }

    if (getIsConnected()) {
      const updated = await Offer.findByIdAndUpdate(id, updates, { new: true })
        .populate('product', 'title sellingPrice images status')
        .populate('buyer', 'fullName email avatar')
        .populate('seller', 'fullName email avatar');

      return res.json({
        success: true,
        message: `Offer ${newStatus} successfully!`,
        data: updated
      });
    } else {
      const updated = storage.updateById('offers', id, updates);
      return res.json({
        success: true,
        message: `Offer ${newStatus} successfully!`,
        data: enrichOffer(updated)
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOffer,
  getMyOffers,
  respondToOffer
};
