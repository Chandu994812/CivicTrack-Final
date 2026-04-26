import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
const router = express.Router();

// Get all users (with filtering)
router.get('/', async (req, res) => {
  try {
    const { role, jurisdiction } = req.query;
    let query = {};
    if (role) query.role = role;
    if (jurisdiction) query.jurisdiction = jurisdiction;

    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    let user;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        user = await User.findById(req.params.id);
    } else {
        user = await User.findOne();
    }
    
    if (!user) {
        return res.json({
            name: 'Chandu Kumar',
            phone: '+91 9876543210',
            email: 'chandu@example.com',
            govId: '',
            ward: 'Ward 12 (Downtown Area)',
            address: { houseNo: '', street: '', colony: '', landmark: '', city: '', district: '', state: '', pincode: '' }
        });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    let user;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        user = await User.findById(req.params.id);
    } else {
        user = await User.findOne();
    }
    
    // If no user exists, it means the token or user id is completely invalid
    if (!user) {
        return res.status(404).json({ message: 'User not found in the database. Please log out and register.' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.email = req.body.email || user.email;
    user.govId = req.body.govId || user.govId;
    user.ward = req.body.ward || user.ward;
    if (req.body.address) {
        user.address = { ...(user.address || {}), ...req.body.address };
    }
    if (req.body.avatar) user.avatar = req.body.avatar;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Mark all notifications as read
router.put('/:id/notifications/read', async (req, res) => {
  try {
    let user;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      user = await User.findById(req.params.id);
    } else {
      user = await User.findOne();
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.notifications.forEach(n => {
      n.read = true;
    });

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
