import mongoose from 'mongoose';
import Post from '../models/Post.js';

export const startEscalationEngine = () => {
  // Run scan every 10 minutes in production, but for demo purposes, we usually rely on it running. 
  // Given we are simulating exactly 7/14/30 days, we run it every hour (3600000 ms).
  // For quick local debugging if the user overrides dates, it's safe to run every 1 minute.
  
  setInterval(async () => {
    try {
      const now = new Date();

      // Village Escalation (7 days)
      const villageThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const villagePosts = await Post.find({
        level: 'Village',
        status: { $ne: 'Resolved' },
        escalationDate: { $lt: villageThreshold }
      });

      for (let post of villagePosts) {
        post.level = 'Mandal';
        post.escalationDate = now;
        post.priorityLevel += 1; 
        await post.save();
        
        // Notify Mandal Authority
        const User = mongoose.model('User');
        const mandalAuth = await User.findOne({ role: 'mandal_authority', jurisdiction: post.jurisdictionInfo.mandal });
        if (mandalAuth) {
           mandalAuth.notifications.push({
             message: `ESCALATION: Complaint "${post.title}" has been escalated to your level from ${post.jurisdictionInfo.village}.`,
             type: 'escalation'
           });
           await mandalAuth.save();
        }

        console.log(`System automatically escalated Post [${post._id}] to Mandal Level.`);
      }

      // Mandal Escalation (14 days past their assigned date)
      const mandalThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const mandalPosts = await Post.find({
        level: 'Mandal',
        status: { $ne: 'Resolved' },
        escalationDate: { $lt: mandalThreshold }
      });

      for (let post of mandalPosts) {
        post.level = 'District';
        post.escalationDate = now;
        post.priorityLevel += 2;
        await post.save();
        console.log(`System automatically escalated Post [${post._id}] to District Level! Critical warning.`);
      }

    } catch (err) {
      console.error('Escalation Engine Error: ', err.message);
    }
  }, 60000); // 1 minute interval for demo testing visibility
};
