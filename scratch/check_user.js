import mongoose from 'mongoose';
import User from './server/models/User.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civikTrack');
    console.log("Connected to MongoDB");

    const email = 'civiktrack.rudravaram@gmail.com';
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      console.log("User Found:");
      console.log("Name:", user.name);
      console.log("Email:", user.email);
      console.log("Role:", user.role);
      console.log("Jurisdiction:", user.jurisdiction);
      console.log("Password Hash:", user.password);
    } else {
      console.log("User NOT found in database.");
      // Check all users to see if any exist
      const allUsers = await User.find({}).limit(5);
      console.log("Sample of 5 users in DB:", allUsers.map(u => u.email));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkUser();
