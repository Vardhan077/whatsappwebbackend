
// === Final Backend Setup for WhatsApp Clone ===

// --- models/Message.js ---
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Number,
    required: true,
  },
  meta_msg_id: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
});

module.exports = mongoose.model('Message', messageSchema);
