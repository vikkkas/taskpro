const mongoose = require('mongoose');

// Work Session Schema
const workSessionSchema = mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  }
}, {
  timestamps: true
});

// Comment Schema
const commentSchema = mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  isAdminRemark: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const taskSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date
  },
  timeSpent: {
    type: Number, // Total time spent in minutes
    default: 0
  },
  isTimerRunning: {
    type: Boolean,
    default: false
  },
  timerStartedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  workSessions: [workSessionSchema],
  comments: [commentSchema],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ dueDate: 1 });

// Pre-save middleware to calculate total time spent
taskSchema.pre('save', function(next) {
  if (this.workSessions && this.workSessions.length > 0) {
    this.timeSpent = this.workSessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
