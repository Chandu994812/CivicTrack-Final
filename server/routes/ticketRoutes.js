import express from 'express';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// Create new support ticket
router.post('/', async (req, res) => {
  const { description, authorId, authorName, authorEmail, authorRole } = req.body;
  if (!description || !authorId) {
      return res.status(400).json({ message: 'Missing required ticket fields' });
  }

  try {
    // HARD LIMIT: 2 Citizens Tickets / Day
    if (!authorRole || authorRole === 'citizen') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const ticketCount = await Ticket.countDocuments({ authorId, createdAt: { $gte: startOfDay }});
      if (ticketCount >= 2) {
         return res.status(429).json({ message: 'Maximum 2 Support Tickets permitted per day.' });
      }
    }

    const generatedTicketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

    const ticket = new Ticket({
      ticketId: generatedTicketId,
      description,
      authorId,
      authorName: authorName || 'Unknown User',
      authorEmail: authorEmail || 'N/A',
      authorRole: authorRole || 'citizen'
    });

    const newTicket = await ticket.save();
    res.status(201).json(newTicket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
