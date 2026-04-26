import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

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
      const allUsers = await User.find({}).limit(10);
      console.log("Sample of 10 users in DB:", allUsers.map(u => u.email));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkUser();
