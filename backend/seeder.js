const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Task = require('./models/Task');

dotenv.config();

const users = [
  {
    name: 'Sarah Chen',
    email: 'sarah@digitalmedia.com',
    password: 'password123',
    role: 'admin',
    department: 'Management',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    name: 'Alex Rodriguez',
    email: 'alex@digitalmedia.com',
    password: 'password123',
    role: 'team-member',
    department: 'Video Production',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  {
    name: 'Emma Thompson',
    email: 'emma@digitalmedia.com',
    password: 'password123',
    role: 'team-member',
    department: 'Graphic Design',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
  },
  {
    name: 'Michael Johnson',
    email: 'michael@digitalmedia.com',
    password: 'password123',
    role: 'team-member',
    department: 'Social Media',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
  },
  {
    name: 'Jessica Park',
    email: 'jessica@digitalmedia.com',
    password: 'password123',
    role: 'team-member',
    department: 'Content Writing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica'
  },
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Task.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed...');

    // Create users
    const createdUsers = await User.create(users);
    console.log('Users Created...');

    // Map user IDs
    const userMap = {};
    createdUsers.forEach((user, index) => {
      userMap[index + 1] = user._id;
    });

    // Create tasks with user references
    const tasks = [
      {
        title: 'Create Instagram Campaign Video',
        description: 'Develop a 30-second promotional video for the new product launch campaign',
        status: 'in-progress',
        priority: 'high',
        assignee: userMap[2], // Alex Rodriguez
        createdBy: userMap[1], // Sarah Chen
        dueDate: new Date('2024-01-20T17:00:00Z'),
        timeSpent: 180,
        isTimerRunning: false,
        tags: ['video', 'instagram', 'campaign'],
        workSessions: [
          {
            startTime: new Date('2024-01-15T09:00:00Z'),
            endTime: new Date('2024-01-15T12:00:00Z'),
            duration: 180,
          },
        ],
        comments: [
          {
            content: 'Please ensure the video follows our brand guidelines and includes the new logo.',
            authorId: userMap[1], // Sarah Chen
            authorName: 'Sarah Chen',
            isAdminRemark: true,
            createdAt: new Date('2024-01-15T10:00:00Z')
          }
        ]
      },
      {
        title: 'Design Brand Logo Variations',
        description: 'Create 5 different logo variations for client presentation',
        status: 'todo',
        priority: 'medium',
        assignee: userMap[3], // Emma Thompson
        createdBy: userMap[1], // Sarah Chen
        dueDate: new Date('2024-01-18T12:00:00Z'),
        timeSpent: 45,
        isTimerRunning: false,
        tags: ['design', 'logo', 'branding'],
        workSessions: [
          {
            startTime: new Date('2024-01-14T11:00:00Z'),
            endTime: new Date('2024-01-14T11:45:00Z'),
            duration: 45,
          },
        ],
        comments: []
      },
      {
        title: 'Social Media Content Calendar',
        description: 'Plan and schedule content for the next month across all platforms',
        status: 'completed',
        priority: 'medium',
        assignee: userMap[4], // Michael Johnson
        createdBy: userMap[1], // Sarah Chen
        dueDate: new Date('2024-01-15T17:00:00Z'),
        timeSpent: 240,
        isTimerRunning: false,
        tags: ['social-media', 'planning', 'content'],
        workSessions: [
          {
            startTime: new Date('2024-01-10T08:00:00Z'),
            endTime: new Date('2024-01-10T12:00:00Z'),
            duration: 240,
          },
        ],
        comments: [
          {
            content: 'Great work on the calendar! The content looks engaging.',
            authorId: userMap[1], // Sarah Chen
            authorName: 'Sarah Chen',
            isAdminRemark: true,
            createdAt: new Date('2024-01-12T16:30:00Z')
          }
        ]
      },
      {
        title: 'Write Blog Post Series',
        description: 'Create a 3-part blog series about digital marketing trends',
        status: 'in-progress',
        priority: 'low',
        assignee: userMap[5], // Jessica Park
        createdBy: userMap[1], // Sarah Chen
        dueDate: new Date('2024-01-25T17:00:00Z'),
        timeSpent: 120,
        isTimerRunning: true,
        timerStartedAt: new Date('2024-01-15T09:15:00Z'),
        tags: ['content', 'blog', 'writing'],
        workSessions: [
          {
            startTime: new Date('2024-01-13T11:00:00Z'),
            endTime: new Date('2024-01-13T13:00:00Z'),
            duration: 120,
          },
        ],
        comments: []
      },
      {
        title: 'Edit Product Demo Video',
        description: 'Final editing and color correction for the product demonstration video',
        status: 'todo',
        priority: 'high',
        assignee: userMap[2], // Alex Rodriguez
        createdBy: userMap[1], // Sarah Chen
        dueDate: new Date('2024-01-17T17:00:00Z'),
        timeSpent: 0,
        isTimerRunning: false,
        tags: ['video', 'editing', 'product'],
        workSessions: [],
        comments: []
      },
      {
        title: 'Create Website Banners',
        description: 'Design promotional banners for the homepage and landing pages',
        status: 'todo',
        priority: 'medium',
        assignee: userMap[3], // Emma Thompson
        createdBy: userMap[1], // Sarah Chen
        dueDate: new Date('2024-01-22T17:00:00Z'),
        timeSpent: 0,
        isTimerRunning: false,
        tags: ['design', 'web', 'banners'],
        workSessions: [],
        comments: []
      },
    ];

    await Task.create(tasks);
    console.log('Tasks Created...');

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();

    await Task.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
