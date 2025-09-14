const Task = require('../models/Task');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { 
  sendTaskAssignedEmail, 
  sendTaskUpdateEmail, 
  sendTaskCompletedEmail,
  sendTaskCommentEmail 
} = require('../utils/emailService');
const { runMigration } = require('../utils/dataMigration');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build base query based on user role
    let baseQuery = {};
    let roleBasedConditions = [];
    
    if (req.user.role === 'team-member') {
      // Team members can see tasks created by them or assigned to them
      roleBasedConditions = [
        { createdBy: req.user._id },
        { assignee: req.user._id }, // Backward compatibility
        { assignees: req.user._id } // New multiple assignees
      ];
    }

    // Build the main query combining role-based access with filters
    let query = {};
    let additionalConditions = [];

    // Add status filter
    if (req.query.status) {
      additionalConditions.push({ status: req.query.status });
    }
    
    // Add priority filter
    if (req.query.priority) {
      additionalConditions.push({ priority: req.query.priority });
    }
    
    // Add assignee filters
    if (req.query.assignee) {
      additionalConditions.push({
        $or: [
          { assignee: req.query.assignee },
          { assignees: req.query.assignee }
        ]
      });
    }
    
    if (req.query.assignees) {
      const assigneeIds = Array.isArray(req.query.assignees) ? req.query.assignees : [req.query.assignees];
      additionalConditions.push({ assignees: { $in: assigneeIds } });
    }
    
    // Add search filter
    if (req.query.search) {
      additionalConditions.push({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Add tags filter
    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
      additionalConditions.push({ tags: { $in: tags } });
    }

    // Don't show archived tasks unless specifically requested
    if (req.query.includeArchived !== 'true') {
      additionalConditions.push({ isArchived: { $ne: true } });
    }

    // Combine role-based access with additional filters
    if (req.user.role === 'team-member') {
      if (additionalConditions.length > 0) {
        query = {
          $and: [
            { $or: roleBasedConditions },
            ...additionalConditions
          ]
        };
      } else {
        query = { $or: roleBasedConditions };
      }
    } else if (req.user.role === 'admin') {
      // Admins can see all tasks, just apply additional filters
      if (additionalConditions.length > 0) {
        query = { $and: additionalConditions };
      } else {
        query = {};
      }
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
      .populate('assignees', 'name email department avatar')
      .populate('activeTimers.userId', 'name email department avatar')
      .populate('timerStartedBy', 'name email department avatar')
      .populate('createdBy', 'name email department avatar')
      .populate('comments.authorId', 'name email avatar')
      .populate('workSessions.startedBy', 'name email department avatar')
      .populate('workSessions.stoppedBy', 'name email department avatar')
      .sort({ updatedAt: -1 }) // Sort by latest updates first
      .skip(skip)
      .limit(limit);

     // Apply custom sorting: latest updates first, then priority
     tasks.sort((a, b) => {
       // First sort by updatedAt (latest first)
       const dateA = new Date(a.updatedAt).getTime();
       const dateB = new Date(b.updatedAt).getTime();
       if (dateA !== dateB) return dateB - dateA; // Latest first
       
       // Then sort by priority (high to low)
       const priorityOrder = { high: 1, medium: 2, low: 3 };
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
      .populate('assignees', 'name email department avatar')
      .populate('activeTimers.userId', 'name email department avatar')
      .populate('timerStartedBy', 'name email department avatar')
      .populate('createdBy', 'name email department avatar')
      .populate('comments.authorId', 'name email avatar')
      .populate('workSessions.startedBy', 'name email department avatar')
      .populate('workSessions.stoppedBy', 'name email department avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to view this task
    if (req.user.role === 'team-member') {
      const isCreator = task.createdBy._id.toString() === req.user._id.toString();
      const isAssignee = task.assignee && task.assignee._id.toString() === req.user._id.toString();
      const isInAssignees = task.assignees && task.assignees.some(assignee => 
        assignee._id.toString() === req.user._id.toString()
      );
      
      if (!isCreator && !isAssignee && !isInAssignees) {
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

    const { title, description, status, priority, dueDate, assignee, assignees, tags } = req.body;

    // Validate assignees if provided
    let validatedAssignees = [];
    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      // Validate all assignees exist
      const foundUsers = await User.find({ _id: { $in: assignees } });
      if (foundUsers.length !== assignees.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more assigned users not found'
        });
      }
      validatedAssignees = assignees;
    } else if (assignee) {
      // Backward compatibility: single assignee
      const assignedUser = await User.findById(assignee);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
      validatedAssignees = [assignee];
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignee: assignee || (validatedAssignees.length === 1 ? validatedAssignees[0] : null), // Backward compatibility
      assignees: validatedAssignees,
      tags,
      createdBy: req.user._id
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email department avatar')
      .populate('assignees', 'name email department avatar')
      .populate('activeTimers.userId', 'name email department avatar')
      .populate('timerStartedBy', 'name email department avatar')
      .populate('createdBy', 'name email department avatar');

    // Send email notifications to all assigned users
    if (validatedAssignees.length > 0) {
      try {
        const assignedUsers = await User.find({ _id: { $in: validatedAssignees } });
        const emailPromises = assignedUsers
          .filter(user => user._id.toString() !== req.user._id.toString()) // Don't email the creator
          .map(user => sendTaskAssignedEmail(populatedTask, user, req.user));
        
        await Promise.allSettled(emailPromises);
      } catch (emailError) {
        console.log('Warning: Task assignment emails could not be sent:', emailError.message);
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
      .populate('assignees', 'name email department avatar')
      .populate('timerStartedBy', 'name email department avatar')
      .populate('createdBy', 'name email department avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions - team members can only update status to completed if they are assigned
    if (req.user.role === 'team-member') {
      const isAssignedUser = (task.assignee && task.assignee._id.toString() === req.user._id.toString()) ||
                            (task.assignees && task.assignees.some(assignee => 
                              assignee._id.toString() === req.user._id.toString()
                            ));
      
      // Team members can only update status and complete tasks assigned to them
      const allowedUpdates = ['status'];
      const updateKeys = Object.keys(req.body);
      const hasUnallowedUpdates = updateKeys.some(key => !allowedUpdates.includes(key));
      
      if (!isAssignedUser || hasUnallowedUpdates) {
        return res.status(403).json({
          success: false,
          message: 'Team members can only update status for tasks assigned to them'
        });
      }
    }

    // Validate assignees if provided
    let updateData = { ...req.body };
    if (req.body.assignees && Array.isArray(req.body.assignees)) {
      const foundUsers = await User.find({ _id: { $in: req.body.assignees } });
      if (foundUsers.length !== req.body.assignees.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more assigned users not found'
        });
      }
      // Update backward compatibility field
      updateData.assignee = req.body.assignees.length === 1 ? req.body.assignees[0] : null;
    } else if (req.body.assignee) {
      // Backward compatibility: single assignee
      const assignedUser = await User.findById(req.body.assignee);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
      // Also update assignees array for consistency
      updateData.assignees = req.body.assignee ? [req.body.assignee] : [];
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignee', 'name email department avatar')
     .populate('assignees', 'name email department avatar')
     .populate('activeTimers.userId', 'name email department avatar')
     .populate('timerStartedBy', 'name email department avatar')
     .populate('createdBy', 'name email department avatar')
     .populate('comments.authorId', 'name email avatar');

    // Send email notifications for updates
    const notifyUsers = new Set(); // Use Set to avoid duplicates
    
    // Notify assignees (both single and multiple) if different from updater
    if (updatedTask.assignee && updatedTask.assignee._id.toString() !== req.user._id.toString()) {
      notifyUsers.add(updatedTask.assignee);
    }
    
    if (updatedTask.assignees && updatedTask.assignees.length > 0) {
      updatedTask.assignees.forEach(assignee => {
        if (assignee._id.toString() !== req.user._id.toString()) {
          notifyUsers.add(assignee);
        }
      });
    }
    
    // Notify creator if different from updater
    if (updatedTask.createdBy._id.toString() !== req.user._id.toString()) {
      notifyUsers.add(updatedTask.createdBy);
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

    // Check if user can start timer - only assigned users can start timers
    const isAssignedUser = (task.assignee && task.assignee.toString() === req.user._id.toString()) ||
                          (task.assignees && task.assignees.some(assigneeId => 
                            assigneeId.toString() === req.user._id.toString()
                          ));

    // Team members can only start timers for tasks assigned to them
    if (req.user.role === 'team-member' && !isAssignedUser) {
      return res.status(403).json({
        success: false,
        message: 'Only assigned team members can start timer for this task'
      });
    }

    // Admins can start timers for any task
    if (req.user.role !== 'admin' && !isAssignedUser) {
      return res.status(403).json({
        success: false,
        message: 'Only assigned users can start timer'
      });
    }

    // Check if this specific user already has a timer running
    const existingTimer = task.activeTimers.find(timer => 
      timer.userId.toString() === req.user._id.toString()
    );

    if (existingTimer) {
      return res.status(400).json({
        success: false,
        message: 'You already have a timer running for this task'
      });
    }

    // Add new timer for this user
    task.activeTimers.push({
      userId: req.user._id,
      startedAt: new Date()
    });

    // Update legacy fields for backward compatibility
    task.isTimerRunning = true;
    task.timerStartedAt = new Date();
    task.timerStartedBy = req.user._id;

    await task.save();

    // Populate the task to return user info
    const populatedTask = await Task.findById(task._id)
      .populate('activeTimers.userId', 'name email department avatar')
      .populate('timerStartedBy', 'name email department avatar');

    res.json({
      success: true,
      data: populatedTask,
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

    // Find the user's active timer
    const userTimerIndex = task.activeTimers.findIndex(timer => 
      timer.userId.toString() === req.user._id.toString()
    );

    if (userTimerIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You do not have an active timer for this task'
      });
    }

    const userTimer = task.activeTimers[userTimerIndex];
    const endTime = new Date();
    const duration = Math.round((endTime - userTimer.startedAt) / (1000 * 60)); // Duration in minutes

    // Create new work session
    const workSession = {
      startTime: userTimer.startedAt,
      endTime: endTime,
      duration: duration,
      userId: req.user._id,
      startedBy: userTimer.userId, // Who originally started the timer
      stoppedBy: req.user._id // Who stopped the timer
    };

    // Remove the user's timer from activeTimers
    task.activeTimers.splice(userTimerIndex, 1);
    task.workSessions.push(workSession);

    // Update legacy fields - if no more active timers, set to false
    if (task.activeTimers.length === 0) {
      task.isTimerRunning = false;
      task.timerStartedAt = null;
      task.timerStartedBy = null;
    } else {
      // Keep the legacy fields pointing to the first remaining active timer
      const firstActiveTimer = task.activeTimers[0];
      task.timerStartedAt = firstActiveTimer.startedAt;
      task.timerStartedBy = firstActiveTimer.userId;
    }

    await task.save();

    // Populate the task to return user info
    const populatedTask = await Task.findById(task._id)
      .populate('activeTimers.userId', 'name email department avatar')
      .populate('timerStartedBy', 'name email department avatar');

    res.json({
      success: true,
      data: populatedTask,
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
      .populate('assignees', 'name email department avatar')
      .populate('activeTimers.userId', 'name email department avatar')
      .populate('timerStartedBy', 'name email department avatar')
      .populate('createdBy', 'name email department avatar')
      .populate('comments.authorId', 'name email avatar')
      .populate('workSessions.startedBy', 'name email department avatar')
      .populate('workSessions.stoppedBy', 'name email department avatar');

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

// @desc    Get active timers (Admin only)
// @route   GET /api/tasks/active-timers
// @access  Private (Admin)
const getActiveTimers = async (req, res) => {
  try {
    // Find all tasks with active timers
    const activeTimerTasks = await Task.find({ 
      isTimerRunning: true,
      isArchived: { $ne: true }
    })
      .populate('assignee', 'name email department avatar')
      .populate('assignees', 'name email department avatar')
      .populate('timerStartedBy', 'name email department avatar')
      .populate('createdBy', 'name email department avatar')
      .sort({ timerStartedAt: -1 });

    // Calculate current duration for each active timer
    const activeTimersWithDuration = activeTimerTasks.map(task => {
      const currentTime = Date.now();
      const additionalMinutes = task.timerStartedAt ? 
        Math.floor((currentTime - new Date(task.timerStartedAt).getTime()) / (1000 * 60)) : 0;
      const totalTimeSpent = task.timeSpent + additionalMinutes;

      return {
        ...task.toObject(),
        currentSessionDuration: additionalMinutes,
        totalTimeSpent: totalTimeSpent
      };
    });

    res.json({
      success: true,
      data: activeTimersWithDuration,
      count: activeTimersWithDuration.length
    });
  } catch (error) {
    console.error('Get active timers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get task analytics (Admin only)
// @route   GET /api/tasks/analytics
// @access  Private (Admin)
const getTaskAnalytics = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ 
      status: { $ne: 'completed' }, 
      isArchived: { $ne: true } 
    });
    const allTasks = await Task.countDocuments({ isArchived: { $ne: true } });
    const completedTasks = await Task.countDocuments({ 
      status: 'completed', 
      isArchived: { $ne: true } 
    });
    const inProgressTasks = await Task.countDocuments({ 
      status: 'in-progress', 
      isArchived: { $ne: true } 
    });
    const todoTasks = await Task.countDocuments({ 
      status: 'todo', 
      isArchived: { $ne: true } 
    });
    const activeTimers = await Task.countDocuments({ 
      isTimerRunning: true,
      isArchived: { $ne: true }
    });

    // Get overdue tasks
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
      isArchived: { $ne: true }
    });

    // Get tasks by assignee
    const tasksByAssignee = await Task.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $unwind: { path: '$assignees', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$assignees', count: { $sum: 1 } } },
      { $lookup: { 
        from: 'users', 
        localField: '_id', 
        foreignField: '_id', 
        as: 'user' 
      }},
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { 
        _id: 1, 
        count: 1, 
        name: '$user.name', 
        email: '$user.email',
        department: '$user.department'
      }}
    ]);

    res.json({
      success: true,
      data: {
        totalTasks,
        allTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        activeTimers,
        overdueTasks,
        completionRate: allTasks > 0 ? Math.round((completedTasks / allTasks) * 100) : 0,
        tasksByAssignee
      }
    });
  } catch (error) {
    console.error('Get task analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Run data migration (Admin only)
// @route   POST /api/tasks/migrate
// @access  Private (Admin)
const migrateData = async (req, res) => {
  try {
    console.log('Starting data migration from API endpoint...');
    
    const result = await runMigration();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Data migration completed successfully',
        data: {
          migrated: result.migrationResult?.migratedCount || 0,
          cleaned: result.cleanupResult?.cleanedCount || 0,
          validated: result.validationResult?.success || false,
          stats: result.validationResult?.stats
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Data migration failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
};

// @desc    Migrate work sessions to add startedBy field
// @route   POST /api/tasks/migrate-sessions
// @access  Private (Admin only)
const migrateWorkSessions = async (req, res) => {
  try {
    console.log('Starting work sessions migration...');
    
    // Find all tasks with work sessions that don't have startedBy
    const tasks = await Task.find({
      'workSessions.startedBy': { $exists: false }
    });
    
    console.log(`Found ${tasks.length} tasks with work sessions to migrate`);
    
    let updatedCount = 0;
    
    for (const task of tasks) {
      let needsUpdate = false;
      
      for (const session of task.workSessions) {
        if (!session.startedBy && session.userId) {
          // Set startedBy to userId for backward compatibility
          session.startedBy = session.userId;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await task.save();
        updatedCount++;
        console.log(`Updated task: ${task.title} (${task._id})`);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully migrated work sessions for ${updatedCount} tasks`,
      updatedCount
    });
    
  } catch (error) {
    console.error('Work sessions migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Work sessions migration failed'
    });
  }
};

// @desc    Edit work session (Admin only)
// @route   PUT /api/tasks/:taskId/sessions/:sessionId
// @access  Private (Admin only)
const editWorkSession = async (req, res) => {
  try {
    const { taskId, sessionId } = req.params;
    const { startTime, endTime, duration, userId, startedBy, stoppedBy } = req.body;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Find the work session
    const sessionIndex = task.workSessions.findIndex(session => 
      session._id.toString() === sessionId
    );

    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Work session not found'
      });
    }

    const session = task.workSessions[sessionIndex];

    // Validate the data
    if (startTime && new Date(startTime) > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start time cannot be in the future'
      });
    }

    if (endTime && new Date(endTime) > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'End time cannot be in the future'
      });
    }

    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time'
      });
    }

    // Update the session
    if (startTime) {
      session.startTime = new Date(startTime);
    }
    if (endTime) {
      session.endTime = new Date(endTime);
    }
    if (duration !== undefined) {
      session.duration = Math.max(0, parseInt(duration)); // Ensure non-negative
    }
    if (userId) {
      session.userId = userId;
    }
    if (startedBy) {
      session.startedBy = startedBy;
    }
    if (stoppedBy !== undefined) {
      session.stoppedBy = stoppedBy;
    }

    // Recalculate duration if both start and end times are provided
    if (startTime && endTime) {
      const calculatedDuration = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60)); // Duration in minutes
      session.duration = Math.max(0, calculatedDuration);
    }

    // Mark the session as modified
    session.markModified('startTime');
    session.markModified('endTime');
    session.markModified('duration');
    session.markModified('userId');
    session.markModified('startedBy');
    session.markModified('stoppedBy');

    // Save the task (this will trigger the pre-save middleware to recalculate total time)
    await task.save();

    // Populate the updated task
    const updatedTask = await Task.findById(taskId)
      .populate('assignee', 'name email department avatar')
      .populate('assignees', 'name email department avatar')
      .populate('activeTimers.userId', 'name email department avatar')
      .populate('timerStartedBy', 'name email department avatar')
      .populate('createdBy', 'name email department avatar')
      .populate('comments.authorId', 'name email avatar')
      .populate('workSessions.startedBy', 'name email department avatar')
      .populate('workSessions.stoppedBy', 'name email department avatar');

    res.json({
      success: true,
      message: 'Work session updated successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Edit work session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update work session'
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
  deleteComment,
  getActiveTimers,
  getTaskAnalytics,
  migrateData,
  migrateWorkSessions,
  editWorkSession
};
