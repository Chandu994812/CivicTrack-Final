import mongoose from 'mongoose';
import Post from './models/Post.js';

const MONGO_URI = 'mongodb://localhost:27017/civikTrack';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Post 1: Over 8 days old (Mandal Escalation)
    const post1 = new Post({
      title: "Pothole causing accidents",
      desc: "A massive pothole on the main road to the bus stand has caused 3 accidents.",
      category: "Roads",
      location: "Main Road",
      status: "In Progress",
      level: "Mandal",
      escalationDate: new Date(now - 8 * dayMs),
      jurisdictionInfo: {
         district: "Krishna",
         mandal: "Machilipatnam",
         village: "Rudravaram"
      },
      author: { name: "Citizen1", email: "cit@example.com", id: "mock_id_1" }
    });

    // Post 2: Over 15 days old (District Escalation)
    const post2 = new Post({
      title: "No drinking water supply",
      desc: "The village has not received any drinking water for the past 2 weeks.",
      category: "Water",
      location: "Water Tank Area",
      status: "Pending",
      level: "District",
      escalationDate: new Date(now - 16 * dayMs),
      jurisdictionInfo: {
         district: "Krishna",
         mandal: "Machilipatnam",
         village: "Chilakalapudi (rural)"
      },
      author: { name: "Citizen2", email: "cit2@example.com", id: "mock_id_2" }
    });

    await post1.save();
    await post2.save();

    console.log("Mock posts created successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
