const express = require('express');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get comments for task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId }).populate('author');
    res.json(comments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create comment
router.post('/', auth, async (req, res) => {
  try {
    const comment = new Comment({ ...req.body, author: req.userId });
    await comment.save();

    // Create notification for task assignee if different from commenter
    const task = await require('../models/Task').findById(req.body.task);
    if (task && task.assignedTo && task.assignedTo.toString() !== req.userId.toString()) {
      const Notification = require('../models/Notification');
      const notification = new Notification({
        user: task.assignedTo,
        type: 'comment_added',
        message: `New comment on task: ${task.title}`,
        relatedId: comment._id
      });
      await notification.save();
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
