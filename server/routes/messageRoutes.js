import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

// Send a message
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, text, postId } = req.body;
    
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    
    if (!sender || !receiver) return res.status(404).json({ message: "User not found" });

    const newMessage = new Message({
      senderId,
      senderName: sender.name,
      senderRole: sender.role,
      receiverId,
      receiverRole: receiver.role,
      text,
      postId
    });

    await newMessage.save();

    // Add notification to receiver
    receiver.notifications.push({
      message: `New message from ${sender.name} (${sender.role}): ${text.substring(0, 30)}...`,
      type: 'message'
    });
    await receiver.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ receiverId: req.params.userId }, { senderId: req.params.userId }]
    }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.put('/read/:messageId', async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.messageId, { read: true }, { new: true });
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
