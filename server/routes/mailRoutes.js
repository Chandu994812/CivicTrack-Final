import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();

router.post('/send', async (req, res) => {
  const { to, subject, message, senderName, receiverId } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Recipient and message are required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"${senderName} via CivikTrack" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject || 'CivikTrack: Official Administrative Directive',
      text: message,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background-color: #1e3a8a; color: #ffffff; padding: 30px; text-align: center; border-bottom: 4px solid #f59e0b;">
             <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">GOVERNMENT OF ANDHRA PRADESH</h1>
             <p style="margin: 8px 0 0 0; font-size: 14px; letter-spacing: 4px; color: #93c5fd; font-weight: bold; text-transform: uppercase;">CivikTrack • State Command Portal</p>
          </div>

          <!-- Body -->
          <div style="padding: 40px 30px;">
             <h2 style="color: #0f172a; border-left: 5px solid #1e3a8a; padding-left: 15px; margin-top: 0; font-size: 20px;">OFFICIAL ADMINISTRATIVE DIRECTIVE</h2>
             
             <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 20px; margin: 25px 0; border-radius: 6px;">
               <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>ISSUING AUTHORITY:</strong> <span style="color: #0f172a;">${senderName}</span></p>
               <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;"><strong>DATE OF ISSUE:</strong> <span style="color: #0f172a;">${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
             </div>

             <div style="margin: 30px 0; font-size: 15px; line-height: 1.7; color: #334155; white-space: pre-wrap; font-family: 'Courier New', Courier, monospace; background-color: #f1f5f9; padding: 25px; border-left: 2px dashed #94a3b8;">
${message}
             </div>

             <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
               <p style="margin: 0; font-size: 14px; font-weight: bold; color: #b91c1c;">URGENT NOTIFICATION</p>
               <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">This is an official communication generated via the AP CivikTrack Governance Platform. The receiving department is legally obligated to review and address the aforementioned directive.</p>
             </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #0f172a; color: #94a3b8; text-align: center; padding: 20px; font-size: 12px; letter-spacing: 0.5px;">
             <p style="margin: 0;">&copy; ${new Date().getFullYear()} Government of Andhra Pradesh. All rights reserved.</p>
             <p style="margin: 5px 0 0 0;">CivikTrack Secure Transmission System • Confidential</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // If receiverId is provided, add an in-app notification
    if (receiverId) {
      const receiver = await User.findById(receiverId);
      if (receiver) {
        receiver.notifications.push({
          message: `Official Email from ${senderName}: ${subject || 'New Directive'}. Check your registered email.`,
          type: 'email_notification'
        });
        await receiver.save();
      }
    }

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({ error: 'Failed to send email. Ensure Server SMTP is configured.' });
  }
});

export default router;
