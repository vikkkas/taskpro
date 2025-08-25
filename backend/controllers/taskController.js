const Task = require('../models/Task');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { 
  sendTaskAssignedEmail, 
  sendTaskUpdateEmail, 
  sendTaskCompletedEmail,
  sendTaskCommentEmail 
} = require('../utils/emailService');

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
    // Handle excludeStatus filter for active tasks tab
    if (req.query.excludeStatus) {
      query.status = { $ne: req.query.excludeStatus };
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.assignee) {
      query.assignee = req.query.assignee;
    }
    
    // Handle search query while preserving role-based filtering
    if (req.query.search) {
      const searchConditions = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
      
      // If we already have a role-based $or condition, combine it with search
      if (query.$or) {
        query.$and = [
          { $or: query.$or }, // Role-based conditions
          { $or: searchConditions } // Search conditions
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }
    
    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
      query.tags = { $in: tags };
    }

    // Don't show archived tasks unless specifically requested
    if (req.query.includeArchived !== 'true') {
      query.isArchived = { $ne: true };
    }
    // Define sorting criteria for database query
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    let sort = {};
    
    // Primary sort by due date (ascending), then priority (high to low)
    sort = { 
      dueDate: 1,  // Ascending - earliest dates first
      priority: 1  // Will be converted using priorityOrder mapping
    };

    const tasks = await Task.find(query)
      .populate('assignee', 'name email department avatar')
      .populate('createdBy', 'name email department avatar')
      .populate('comments.authorId', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Apply custom sorting for priority while preserving pagination
    tasks.sort((a, b) => {
      // First sort by due date
      if (a.dueDate && b.dueDate) {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
      }
      // Put tasks with due dates before those without
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // Then sort by priority (high to low)
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

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

    // Send email notification if task is assigned to someone
    if (assignee && assignee !== req.user._id.toString()) {
      try {
        const assigneeUser = await User.findById(assignee);
        if (assigneeUser) {
          await sendTaskAssignedEmail(
            populatedTask,
            assigneeUser,
            req.user
          );
        }
      } catch (emailError) {
        console.log('Warning: Task assignment email could not be sent:', emailError.message);
      }
    }

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
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email department avatar')
      .populate('createdBy', 'name email department avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    // if (req.user.role === 'team-member' && task.createdBy.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied'
    //   });
    // }

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

    // Send email notifications for updates
    const notifyUsers = [];
    
    // Notify assignee if different from updater
    if (updatedTask.assignee && updatedTask.assignee._id.toString() !== req.user._id.toString()) {
      notifyUsers.push(updatedTask.assignee);
    }
    
    // Notify creator if different from updater and assignee
    if (updatedTask.createdBy._id.toString() !== req.user._id.toString() && 
        (!updatedTask.assignee || updatedTask.createdBy._id.toString() !== updatedTask.assignee._id.toString())) {
      notifyUsers.push(updatedTask.createdBy);
    }

    // Send emails to relevant users
    for (const user of notifyUsers) {
      try {
        await sendTaskUpdateEmail(
          updatedTask,
          req.user,
          user
        );
      } catch (emailError) {
        console.log(`Warning: Task update email could not be sent to ${user.email}:`, emailError.message);
      }
    }

    // Check if task was completed and send completion email
    if (updatedTask.status === 'completed') {
      const notifyUsers = [];
      
      // Notify creator if different from the person who completed it
      if (updatedTask.createdBy._id.toString() !== req.user._id.toString()) {
        notifyUsers.push(updatedTask.createdBy);
      }
      
      // Notify other stakeholders (you can expand this logic)
      for (const user of notifyUsers) {
        try {
          await sendTaskCompletedEmail(
            updatedTask,
            req.user,
            user
          );
        } catch (emailError) {
          console.log(`Warning: Task completion email could not be sent to ${user.email}:`, emailError.message);
        }
      }
    }

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

    // Send email notifications for new comments
    try {
      const notifyUsers = [];
      
      // Notify assignee if different from comment author
      if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
        const assigneeUser = await User.findById(task.assignee);
        if (assigneeUser) notifyUsers.push(assigneeUser);
      }
      
      // Notify creator if different from comment author and assignee
      if (task.createdBy.toString() !== req.user._id.toString() && 
          (!task.assignee || task.createdBy.toString() !== task.assignee.toString())) {
        const creatorUser = await User.findById(task.createdBy);
        if (creatorUser) notifyUsers.push(creatorUser);
      }

      // Send email notifications about the comment
      for (const user of notifyUsers) {
        try {
          await sendTaskCommentEmail(
            updatedTask,
            comment,
            req.user,
            user
          );
        } catch (emailError) {
          console.log(`Warning: Comment notification email could not be sent to ${user.email}:`, emailError.message);
        }
      }
    } catch (notificationError) {
      console.log('Warning: Comment notification failed:', notificationError.message);
    }

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
  startTimer,
  stopTimer,
  addComment,
  deleteComment
};
