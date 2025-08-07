const Task = require('../models/Task');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'team-member') {
      // Team members can see tasks created by them or assigned to them
      query = {
        $or: [
          { createdBy: req.user._id },
          { assignee: req.user._id }
        ]
      };
    } else if (req.user.role === 'admin') {
      // Admins can see all tasks
      query = {};
    }

    // Add filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.assignee) {
      query.assignee = req.query.assignee;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
      query.tags = { $in: tags };
    }

    // Don't show archived tasks unless specifically requested
    if (req.query.includeArchived !== 'true') {
      query.isArchived = { $ne: true };
    }

    const tasks = await Task.find(query)
      .populate('assignee', 'name email department avatar')
      .populate('createdBy', 'name email department avatar')
      .populate('comments.authorId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email department avatar')
      .populate('createdBy', 'name email department avatar')
      .populate('comments.authorId', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to view this task
    if (req.user.role === 'team-member') {
      if (task.createdBy._id.toString() !== req.user._id.toString() && 
          (!task.assignee || task.assignee._id.toString() !== req.user._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, status, priority, dueDate, assignee, tags } = req.body;

    // If assigning to someone, check if that user exists
    if (assignee) {
      const assignedUser = await User.findById(assignee);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignee,
      tags,
      createdBy: req.user._id
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email department avatar')
      .populate('createdBy', 'name email department avatar');

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.user.role === 'team-member' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If assigning to someone, check if that user exists
    if (req.body.assignee) {
      const assignedUser = await User.findById(req.body.assignee);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignee', 'name email department avatar')
     .populate('createdBy', 'name email department avatar')
     .populate('comments.authorId', 'name email avatar');

    res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions - only creator or admin can delete
    if (req.user.role === 'team-member' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Archive/Unarchive task
// @route   PUT /api/tasks/:id/archive
// @access  Private
const archiveTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.user.role === 'team-member' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    task.isArchived = !task.isArchived;
    await task.save();

    res.json({
      success: true,
      data: task,
      message: `Task ${task.isArchived ? 'archived' : 'unarchived'} successfully`
    });
  } catch (error) {
    console.error('Archive task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Start timer for task
// @route   POST /api/tasks/:id/timer/start
// @access  Private
const startTimer = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can start timer (assignee or creator)
    if (!task.assignee || task.assignee.toString() !== req.user._id.toString()) {
      if (task.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only assigned user or creator can start timer'
        });
      }
    }

    if (task.isTimerRunning) {
      return res.status(400).json({
        success: false,
        message: 'Timer is already running'
      });
    }

    task.isTimerRunning = true;
    task.timerStartedAt = new Date();
    await task.save();

    res.json({
      success: true,
      data: task,
      message: 'Timer started successfully'
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Stop timer for task
// @route   POST /api/tasks/:id/timer/stop
// @access  Private
const stopTimer = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can stop timer (assignee or creator)
    if (!task.assignee || task.assignee.toString() !== req.user._id.toString()) {
      if (task.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only assigned user or creator can stop timer'
        });
      }
    }

    if (!task.isTimerRunning) {
      return res.status(400).json({
        success: false,
        message: 'Timer is not running'
      });
    }

    const endTime = new Date();
    const duration = Math.round((endTime - task.timerStartedAt) / (1000 * 60)); // Duration in minutes

    // Create new work session
    const workSession = {
      startTime: task.timerStartedAt,
      endTime: endTime,
      duration: duration
    };

    task.workSessions.push(workSession);
    task.isTimerRunning = false;
    task.timerStartedAt = null;
    await task.save();

    res.json({
      success: true,
      data: task,
      message: 'Timer stopped successfully',
      sessionDuration: duration
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = {
      content: content.trim(),
      authorId: req.user._id,
      authorName: req.user.name,
      isAdminRemark: req.user.role === 'admin'
    };

    task.comments.push(comment);
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email department avatar')
      .populate('createdBy', 'name email department avatar')
      .populate('comments.authorId', 'name email avatar');

    res.json({
      success: true,
      data: updatedTask,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete comment from task
// @route   DELETE /api/tasks/:id/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = task.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can delete comment (author or admin)
    if (comment.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    task.comments.pull(req.params.commentId);
    await task.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  archiveTask,
  startTimer,
  stopTimer,
  addComment,
  deleteComment
};
