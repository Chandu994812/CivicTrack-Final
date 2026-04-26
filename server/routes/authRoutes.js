import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Otp from '../models/Otp.js';

const router = express.Router();

// Check if email or phone is already registered
router.post('/check-duplicate', async (req, res) => {
  try {
    const { email: rawEmail, phone } = req.body;
    const email = rawEmail?.toLowerCase().trim();
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });
    
    const existingPhone = await User.findOne({ phone: `+91 ${phone}` });
    if (existingPhone) return res.status(400).json({ message: 'Mobile number already registered' });

    res.json({ message: 'Verification details are unique' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate and send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = rawEmail?.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/Update OTP in DB
    await Otp.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send Mail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"CivikTrack Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'CivikTrack: Verify your Registration',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">Identity Verification</h2>
          <p>You are one step away from joining CivikTrack. Use the following code to verify your account:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000; margin: 24px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #64748b;">This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send verification code.' });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email: rawEmail, password, phone, otp } = req.body;
    const email = rawEmail?.toLowerCase().trim();
    
    // Verify OTP
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Check if user already exists (Final guard)
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || 'N/A',
      notifications: [{
         message: `Welcome to CivikTrack, ${name}! Start interacting with your local civic structure today.`,
         type: 'system'
      }]
    });

    await user.save();
    
    // Cleanup OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.toLowerCase().trim();
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const payload = { user: { id: user.id } };
    
    // Sign token (using a dummy secret for dev if one isn't in .env)
    const secret = process.env.JWT_SECRET || 'civiktrack_super_secret';
    jwt.sign(payload, secret, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, jurisdiction: user.jurisdiction } });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = rawEmail?.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email. Please register first.' });
    }

    // Generate a simple token or just simulate the link for now as requested
    // In a real app, you'd save a reset token in the DB with expiry
    const resetLink = `http://localhost:5173/reset-password?uid=${user._id}&token=${Math.random().toString(36).substr(2)}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"CivikTrack Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'CivikTrack: Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">Password Reset</h2>
          <p>We received a request to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">If you did not request this, please ignore this email. The link is for demonstration purposes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset link has been dispatched to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to process reset request.' });
  }
});

export default router;
