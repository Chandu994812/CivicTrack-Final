import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Post from './models/Post.js';
import User from './models/User.js';

dotenv.config();

const initialPosts = [
  {
    title: 'Major Pipeline Burst',
    desc: 'Main water pipeline burst near the city hospital. Flooding the streets and causing severe water shortage in the neighborhood.',
    image: 'https://images.unsplash.com/photo-1542361345-89e58247f2d5?auto=format&fit=crop&q=80',
    category: 'Water',
    location: 'City Hospital Road',
    status: 'In Progress',
    votes: 145,
    author: { name: 'Rahul Sharma', avatar: 'https://i.pravatar.cc/150?u=rahul' },
    comments: 24,
    time: '2 hours ago'
  },
  {
    title: 'Severe Road Damage',
    desc: 'Big pothole near bus stand causing daily accidents. Needs immediate fixing.',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
    category: 'Road',
    location: 'Main Bus Stand',
    status: 'Pending',
    votes: 45,
    author: { name: 'Sneha Patel', avatar: 'https://i.pravatar.cc/150?u=sneha' },
    comments: 8,
    time: '5 hours ago'
  },
  {
    title: 'Broken Street Light',
    desc: 'Street lights have not been working for the past two weeks, making it unsafe for pedestrians at night.',
    image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&q=80',
    category: 'Electricity',
    location: 'Park Avenue',
    status: 'Resolved',
    votes: 112,
    author: { name: 'Kiran Kumar', avatar: 'https://i.pravatar.cc/150?u=kiran' },
    comments: 15,
    time: '1 day ago'
  },
  {
    title: 'Illegal Garbage Dumping',
    desc: 'Garbage not cleaned for 3 days and people are dumping more waste illegally on the empty plot.',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80',
    category: 'Garbage',
    location: 'Sector 4 Market',
    status: 'Pending',
    votes: 85,
    author: { name: 'Anjali Desai', avatar: 'https://i.pravatar.cc/150?u=anjali' },
    comments: 12,
    time: '3 hours ago'
  }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing initial dummy posts to avoid duplicates (optional depending on use case)
        await Post.deleteMany({});
        await User.deleteMany({});

        await Post.insertMany(initialPosts);
        console.log('Database seeded with Initial Posts');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        const dummyUser = new User({
            name: 'Chandu Kumar',
            phone: '+91 9876543210',
            email: 'chandu@example.com',
            password: hashedPassword,
            govId: '1234-5678-9012',
            ward: 'Ward 12 (Downtown Area)'
        });
        await dummyUser.save();
        console.log('Database seeded with Dummy User');

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding DB:', err);
        mongoose.connection.close();
    }
};

seedDB();
