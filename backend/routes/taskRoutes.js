const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const { allUsers } = require('../middleware/roleMiddleware');

const router = express.Router();

// Validation rules
const createTaskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed'])
    .withMessage('Status must be todo, in-progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('assignee')
    .optional()
    .isMongoId()
    .withMessage('Assignee user ID must be valid'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed'])
    .withMessage('Status must be todo, in-progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('assignee')
    .optional()
    .isMongoId()
    .withMessage('Assignee user ID must be valid'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment content is required and must be less than 500 characters')
];

// Apply authentication and role middleware to all routes
router.use(authMiddleware);
router.use(allUsers);

// Task routes
router.route('/')
  .get(getTasks)
  .post(createTaskValidation, createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTaskValidation, updateTask)
  .delete(deleteTask);

// Archive route
router.put('/:id/archive', archiveTask);

// Timer routes
router.post('/:id/timer/start', startTimer);
router.post('/:id/timer/stop', stopTimer);

// Comment routes
router.post('/:id/comments', commentValidation, addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
