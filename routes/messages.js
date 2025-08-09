const express = require('express');
const router = express.Router();
const Message = require('../models/message');



// --- routes/messages.js ---

router.post('/send', async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    const newMsg = await Message.create({
      sender,
      receiver,
      message,
      timestamp: Math.floor(Date.now() / 1000),
      meta_msg_id: Math.random().toString(36).substring(2, 15),
      status: 'sent',
    });
    res.json(newMsg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});



router.get('/messages/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    // Mark messages sent by user2 to user1 as "read"
    await Message.updateMany(
      {
        sender: user2,
        receiver: user1,
        status: { $ne: 'read' }
      },
      { $set: { status: 'read' } }
    );

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});



module.exports = router;
