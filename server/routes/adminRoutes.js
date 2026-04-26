import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Ticket from '../models/Ticket.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const router = express.Router();

// Get all users with post counts
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().lean();
    
    // Efficiently get counts (you could also use aggregate, but a manual mapping is fine for this scale)
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const postCount = await Post.countDocuments({ "author.name": user.name }); 
      // Simplified relation assuming author name matches (ideal real-world uses an authorId ref, 
      // but CivikTrack natively decoupled it to author: {name, avatar}).
      return { ...user, postCount };
    }));

    res.json({ users: usersWithStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user and cascade posts
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Delete all posts where author name matches (simulating cascade for decoupled schema)
    await Post.deleteMany({ "author.name": user.name });
    
    // Delete the user
    await user.deleteOne();
    res.json({ message: 'User and associated posts deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update User Password (Reset)
router.put('/users/:id/password', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'Missing custom password input.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Absolute Override: Password successfully updated.' });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

// Ban User from Posting (canPost = false)
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.canPost = false;
    await user.save();
    res.json({ message: 'User actively banned from generating future complaints' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all tickets & Auto-Purge routine
router.get('/tickets', async (req, res) => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    // Automatically obliterate Resolved tickets strictly 3 days out
    await Ticket.deleteMany({ status: 'Resolved', createdAt: { $lte: threeDaysAgo } });

    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Ticket Status
router.put('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const oldStatus = ticket.status;
    ticket.status = req.body.status || ticket.status;
    await ticket.save();

    // Broadcast Resolution Notification directly into the Citizen document array upon state-change
    if (oldStatus !== 'Resolved' && ticket.status === 'Resolved') {
        const user = await User.findById(ticket.authorId);
        if (user) {
            user.notifications.unshift({
                message: `Support Alert: Your Issue Tracker Ticket [${ticket.ticketId || ticket._id}] has been classified as RESOLVED!`,
                type: 'ticket'
            });
            await user.save();
        }
    }

    res.json(ticket);
  } catch(err) {
    res.status(400).json({ message: err.message });
  }
});

// Create Authority Account & Email password
router.post('/authorities', async (req, res) => {
  try {
    const { name, email: rawEmail, password, role, jurisdiction, phone } = req.body;
    const email = rawEmail.toLowerCase().trim();
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name, email, password: hashedPassword, phone: phone || 'N/A', role, jurisdiction
    });
    
    try {
      await user.save();
    } catch (saveErr) {
      console.error("CRITICAL: Failed to save authority user:", saveErr);
      return res.status(500).json({ message: 'Database save failed', details: saveErr.message });
    }

    // Use Real SMTP credentials from .env (EMAIL_USER and EMAIL_PASS)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const displayRole = role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const emailTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
         <div style="background-color: #0f172a; padding: 40px 20px; text-align: center; color: white;">
             <h1 style="margin:0; font-size: 24px; letter-spacing: -0.025em; font-weight: 800;">Civik<span style="color: #3b82f6;">Track</span></h1>
             <p style="margin: 10px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700;">Official Command Provisioning</p>
         </div>
         <div style="padding: 40px; color: #334155; line-height: 1.6;">
            <p style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 24px;">Authorization Successful</p>
            <p>Greetings <b>${name}</b>,</p>
            <p>You have been formally designated as a <b>${displayRole}</b> for the <b>${jurisdiction}</b> jurisdiction. Your administrative credentials have been generated and are active.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; margin: 32px 0;">
               <p style="margin: 0 0 12px 0; font-size: 10px; font-weight: 800; text-transform: uppercase; tracking: 0.05em; color: #64748b;">Credentials Vault</p>
               <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                     <td style="padding: 4px 0; font-size: 14px; color: #64748b;">Identifier:</td>
                     <td style="padding: 4px 0; font-size: 14px; color: #1e293b; font-weight: 600;">${email}</td>
                  </tr>
                  <tr>
                     <td style="padding: 4px 0; font-size: 14px; color: #64748b;">Access Key:</td>
                     <td style="padding: 4px 0; font-size: 14px; color: #2563eb; font-weight: 800; font-family: monospace;">${password}</td>
                  </tr>
               </table>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-bottom: 32px;"><b>PROTOCOL NOTICE:</b> For security compliance, you are required to authenticate using these credentials and immediately establish a permanent password via the profile synchronization tool.</p>
            
            <a href="http://localhost:5173/login" style="display:block; text-align: center; padding: 16px; background-color: #2563eb; color: white; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);">Acknowledge & Access Portal</a>
         </div>
         <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600;">
            OFFICIAL CORRESPONDENCE | CIVIKTRACK GOVERNMENTAL OPERATIONS<br/>
            This is a mandatory system notification.
         </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"CivikTrack Administration" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Executive Access Provisioned: ${displayRole} Credentials`,
      html: emailTemplate
    });

    res.status(201).json({ message: 'Authority created and official communiqué dispatched.', realEmail: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
