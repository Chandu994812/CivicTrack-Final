import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  image: { type: String, default: '' },
  category: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  level: { type: String, enum: ['Village', 'Mandal', 'District', 'Resolved'], default: 'Village' },
  escalationDate: { type: Date, default: Date.now },
  priorityLevel: { type: Number, default: 1 },
  resolutionProof: {
    comment: String,
    imageUrl: String,
    resolvedBy: String,
    resolvedRole: String
  },
  jurisdictionInfo: {
    village: String,
    mandal: String,
    district: String
  },
  deletion: {
    isDeleted: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    deletedBy: { type: String, default: '' },
    deletedAt: { type: Date }
  },
  tasks: [{
    assignedDept: { type: String },
    status: { type: String, enum: ['Pending', 'Reported', 'Solved'], default: 'Pending' },
    desc: { type: String },
    contactNumber: { type: String },
    email: { type: String },
    contactDetails: { type: String },
    resolutionImage: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  votes: { type: Number, default: 0 },
  votedBy: [{ type: String }],
  author: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, default: 'https://i.pravatar.cc/150' }
  },
  comments: { type: Number, default: 0 },
  commentsData: [{
    user: { type: String, required: true },
    avatar: { type: String },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  time: { type: String, default: 'Just now' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Post', postSchema);
