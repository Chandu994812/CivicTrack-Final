import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true },
  description: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  authorRole: { type: String, default: 'citizen' },
  status: { type: String, default: 'Open' }, // Open, In Progress, Resolved
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Ticket', ticketSchema);
