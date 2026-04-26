import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
const router = express.Router();

// Get all posts (with jurisdiction filtering)
router.get('/', async (req, res) => {
  try {
    const { district, mandal, village, status } = req.query;
    let query = {};
    
    if (district) query['jurisdictionInfo.district'] = { $regex: new RegExp(`^${district}$`, 'i') };
    if (mandal) query['jurisdictionInfo.mandal'] = { $regex: new RegExp(`^${mandal}$`, 'i') };
    if (village) query['jurisdictionInfo.village'] = { $regex: new RegExp(`^${village}$`, 'i') };
    if (status) query.status = status;

    const posts = await Post.find(query).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // ENHANCEMENT: If author metadata is sparse (missing email/id), attempt to hydrate it
    // This supports older posts where these fields weren't explicitly saved.
    if (!post.author.email || !post.author.id) {
       const user = await User.findOne({ name: post.author.name });
       if (user) {
          // Temporarily attach for the response (don't save to avoid massive DB writes on GET)
          const postObj = post.toObject();
          postObj.author.id = user._id;
          postObj.author.email = user.email;
          return res.json(postObj);
       }
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Invalid Post ID' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    // Check if the citizen is banned from posting
    if (req.body.author && req.body.author.id) {
       const user = await User.findById(req.body.author.id);
       if (user && user.canPost === false) {
          return res.status(403).json({ message: "ACCOUNT RESTRICTED: You are permanently banned from creating new complaints." });
       }
    }

    const post = new Post({
      title: req.body.title,
      desc: req.body.desc,
      image: req.body.image,
      category: req.body.category,
      location: req.body.location,
      author: req.body.author
    });

    const newPost = await post.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Upvote/Downvote toggle for a post
router.put('/:id/vote', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const userId = req.body.userId || 'Anonymous';
    const hasVoted = post.votedBy.includes(userId);

    let updatedPost;
    if (hasVoted) {
      // Toggle OFF: Remove vote
      updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { 
          $pull: { votedBy: userId },
          $inc: { votes: -1 }
        },
        { new: true }
      );
    } else {
      // Toggle ON: Add vote
      updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { 
          $push: { votedBy: userId },
          $inc: { votes: 1 }
        },
        { new: true }
      );
    }
    
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Add a comment
router.post('/:id/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = {
      user: req.body.userName || 'Citizen',
      avatar: req.body.userAvatar || 'https://i.pravatar.cc/150',
      text: req.body.text
    };

    post.commentsData.push(newComment);
    post.comments = post.commentsData.length;
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a post
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a post (Used by authorities for status/escalation updates)
router.put('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (req.body.status) post.status = req.body.status;
    if (req.body.level) {
       post.level = req.body.level;
       post.escalationDate = Date.now(); // Reset timer upon forced escalation/demotion
    }
    if (req.body.resolutionProof) post.resolutionProof = req.body.resolutionProof;
    if (req.body.priorityLevel) post.priorityLevel = req.body.priorityLevel;
    if (req.body.tasks) post.tasks = req.body.tasks;
    if (req.body.deletion) post.deletion = req.body.deletion;

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
