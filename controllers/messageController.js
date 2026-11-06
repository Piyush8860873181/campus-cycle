const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Product = require('../models/Product');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const storage = require('../utils/storageAdapter');

// Helper to enrich conversation
const enrichConversation = (conv, currentUserId) => {
  if (!conv) return null;
  let product = conv.product;
  if (typeof product !== 'object' || !product.title) {
    product = storage.findById('products', product);
  }

  const otherParticipantId = conv.participants.find(p => p.toString() !== currentUserId.toString());
  let otherUser = storage.findById('users', otherParticipantId);
  if (otherUser) {
    const { password, ...safe } = otherUser;
    otherUser = safe;
  }

  return {
    ...conv,
    product,
    otherUser: otherUser || {
      _id: otherParticipantId,
      fullName: 'Campus Student',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Student',
      collegeName: 'Campus'
    }
  };
};

// @desc    Get user's conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (getIsConnected()) {
      const convs = await Conversation.find({ participants: userId })
        .populate('participants', 'fullName email avatar collegeName isCollegeVerified')
        .populate('product', 'title sellingPrice images status collegeName')
        .sort({ lastMessageTime: -1 });

      // format otherUser for ease of frontend consumption
      const formatted = convs.map(c => {
        const obj = c.toObject();
        const other = obj.participants.find(p => p._id.toString() !== userId);
        return {
          ...obj,
          otherUser: other
        };
      });

      return res.json({
        success: true,
        data: formatted,
      });
    } else {
      const convs = storage
        .find('conversations', c => c.participants.includes(userId))
        .map(c => enrichConversation(c, userId))
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      return res.json({
        success: true,
        data: convs,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    if (getIsConnected()) {
      const messages = await Message.find({ conversation: conversationId })
        .populate('sender', 'fullName avatar')
        .populate('recipient', 'fullName avatar')
        .populate('offer')
        .sort({ createdAt: 1 });

      return res.json({
        success: true,
        data: messages,
      });
    } else {
      const messages = storage
        .find('messages', m => m.conversation === conversationId)
        .map(m => {
          let sender = storage.findById('users', m.sender);
          if (sender) {
            const { password, ...safe } = sender;
            sender = safe;
          }
          let offer = m.offer ? storage.findById('offers', m.offer) : null;
          return {
            ...m,
            sender,
            offer
          };
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return res.json({
        success: true,
        data: messages,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a message (and create conversation if needed)
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const senderId = (req.user._id || req.user.id).toString();
    const { recipientId, productId, content, conversationId, offerId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    let activeConversationId = conversationId;

    // Find or create conversation
    if (!activeConversationId) {
      if (!recipientId || !productId) {
        return res.status(400).json({ success: false, message: 'recipientId and productId are required to start a conversation.' });
      }

      if (getIsConnected()) {
        let existing = await Conversation.findOne({
          participants: { $all: [senderId, recipientId] },
          product: productId,
        });

        if (!existing) {
          existing = await Conversation.create({
            participants: [senderId, recipientId],
            product: productId,
            lastMessage: content,
            lastMessageTime: new Date(),
          });
        }
        activeConversationId = existing._id;
      } else {
        let existing = storage.findOne('conversations', c => 
          c.product === productId &&
          c.participants.includes(senderId) &&
          c.participants.includes(recipientId)
        );

        if (!existing) {
          existing = storage.insert('conversations', {
            participants: [senderId, recipientId],
            product: productId,
            lastMessage: content,
            lastMessageTime: new Date().toISOString()
          });
        }
        activeConversationId = existing._id;
      }
    }

    const messagePayload = {
      conversation: activeConversationId,
      sender: senderId,
      recipient: recipientId,
      content,
      offer: offerId || null,
      read: false,
    };

    if (getIsConnected()) {
      const msg = await Message.create(messagePayload);
      await Conversation.findByIdAndUpdate(activeConversationId, {
        lastMessage: content,
        lastMessageTime: new Date(),
      });

      const populated = await Message.findById(msg._id)
        .populate('sender', 'fullName avatar')
        .populate('offer');

      return res.status(201).json({
        success: true,
        data: populated,
        conversationId: activeConversationId
      });
    } else {
      const msg = storage.insert('messages', messagePayload);
      storage.updateById('conversations', activeConversationId, {
        lastMessage: content,
        lastMessageTime: new Date().toISOString()
      });

      let sender = storage.findById('users', senderId);
      if (sender) {
        const { password, ...safe } = sender;
        sender = safe;
      }
      let offer = offerId ? storage.findById('offers', offerId) : null;

      return res.status(201).json({
        success: true,
        data: {
          ...msg,
          sender,
          offer
        },
        conversationId: activeConversationId
      });
    }
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
};
