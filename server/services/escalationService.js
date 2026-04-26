import cron from 'node-cron';
import Post from '../models/Post.js';
import User from '../models/User.js';

export const initEscalationCron = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running Escalation Check...');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Find posts still at Village level, older than 7 days, and not resolved
      const escalatablePosts = await Post.find({
        level: 'Village',
        status: { $ne: 'Resolved' },
        createdAt: { $lte: sevenDaysAgo },
        'deletion.isDeleted': false
      });

      for (const post of escalatablePosts) {
        post.level = 'Mandal';
        post.escalationDate = new Date();
        await post.save();

        // Notify Mandal Authority of this mandal
        const mandalAuthority = await User.findOne({
          role: 'mandal_authority',
          jurisdiction: post.jurisdictionInfo.mandal
        });

        if (mandalAuthority) {
          mandalAuthority.notifications.push({
            message: `URGENT: Complaint "${post.title}" has been escalated to your level from ${post.jurisdictionInfo.village}.`,
            type: 'escalation'
          });
          await mandalAuthority.save();
        }
      }
      
      console.log(`Escalated ${escalatablePosts.length} posts.`);
    } catch (error) {
      console.error('Escalation Cron Error:', error);
    }
  });
};
