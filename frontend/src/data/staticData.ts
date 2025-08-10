// import { User, UserRole } from '@/types/auth';
// import { Task } from '@/types/task';

// export const users: User[] = [
//   {
//     id: '1',
//     name: 'Sarah Chen',
//     email: 'sarah@digitalmedia.com',
//     role: 'admin',
//     department: 'Management',
//     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
//   },
//   {
//     id: '2',
//     name: 'Alex Rodriguez',
//     email: 'alex@digitalmedia.com',
//     role: 'team-member',
//     department: 'Video Production',
//     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
//   },
//   {
//     id: '3',
//     name: 'Emma Thompson',
//     email: 'emma@digitalmedia.com',
//     role: 'team-member',
//     department: 'Graphic Design',
//     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
//   },
//   {
//     id: '4',
//     name: 'Michael Johnson',
//     email: 'michael@digitalmedia.com',
//     role: 'team-member',
//     department: 'Social Media',
//     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
//   },
//   {
//     id: '5',
//     name: 'Jessica Park',
//     email: 'jessica@digitalmedia.com',
//     role: 'team-member',
//     department: 'Content Writing',
//     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica'
//   },
// ];

// export const tasks: Task[] = [
//   {
//     _id: '1',
//     title: 'Create Instagram Campaign Video',
//     description: 'Develop a 30-second promotional video for the new product launch campaign',
//     status: 'in-progress',
//     priority: 'high',
//     assignee: '2',
//     createdAt: '2024-01-15T09:00:00Z',
//     updatedAt: '2024-01-15T14:30:00Z',
//     dueDate: '2024-01-20T17:00:00Z',
//     timeSpent: 180,
//     isTimerRunning: false,
//     tags: ['video', 'instagram', 'campaign'],
//     workSessions: [
//       {
//         _id: '1-1',
//         startTime: '2024-01-15T09:00:00Z',
//         endTime: '2024-01-15T12:00:00Z',
//         duration: 180,
//       },
//     ],
//     comments: [
//       {
//         _id: 'c1',
//         content: 'Please ensure the video follows our brand guidelines and includes the new logo.',
//         authorId: '1',
//         authorName: 'Sarah Chen',
//         createdAt: '2024-01-15T10:00:00Z',
//         isAdminRemark: true
//       }
//     ]
//   },
//   {
//     _id: '2',
//     title: 'Design Brand Logo Variations',
//     description: 'Create 5 different logo variations for client presentation',
//     status: 'todo',
//     priority: 'medium',
//     assignee: '3',
//     createdAt: '2024-01-14T10:00:00Z',
//     updatedAt: '2024-01-14T10:00:00Z',
//     dueDate: '2024-01-18T12:00:00Z',
//     timeSpent: 45,
//     isTimerRunning: false,
//     tags: ['design', 'logo', 'branding'],
//     workSessions: [
//       {
//         _id: '2-1',
//         startTime: '2024-01-14T11:00:00Z',
//         endTime: '2024-01-14T11:45:00Z',
//         duration: 45,
//       },
//     ],
//     comments: []
//   },
//   {
//     _id: '3',
//     title: 'Social Media Content Calendar',
//     description: 'Plan and schedule content for the next month across all platforms',
//     status: 'completed',
//     priority: 'medium',
//     assignee: '4',
//     createdAt: '2024-01-10T08:00:00Z',
//     updatedAt: '2024-01-12T16:00:00Z',
//     dueDate: '2024-01-15T17:00:00Z',
//     timeSpent: 240,
//     isTimerRunning: false,
//     tags: ['social-media', 'planning', 'content'],
//     workSessions: [
//       {
//         _id: '3-1',
//         startTime: '2024-01-10T08:00:00Z',
//         endTime: '2024-01-10T12:00:00Z',
//         duration: 240,
//       },
//     ],
//     comments: [
//       {
//         _id: 'c3',
//         content: 'Great work on the calendar! The content looks engaging.',
//         authorId: '1',
//         authorName: 'Sarah Chen',
//         createdAt: '2024-01-12T16:30:00Z',
//         isAdminRemark: true
//       }
//     ]
//   },
//   {
//     _id: '4',
//     title: 'Write Blog Post Series',
//     description: 'Create a 3-part blog series about digital marketing trends',
//     status: 'in-progress',
//     priority: 'low',
//     assignee: '5',
//     createdAt: '2024-01-13T11:00:00Z',
//     updatedAt: '2024-01-15T09:15:00Z',
//     dueDate: '2024-01-25T17:00:00Z',
//     timeSpent: 120,
//     isTimerRunning: true,
//     timerStartedAt: '2024-01-15T09:15:00Z',
//     tags: ['content', 'blog', 'writing'],
//     workSessions: [
//       {
//         _id: '4-1',
//         startTime: '2024-01-13T11:00:00Z',
//         endTime: '2024-01-13T13:00:00Z',
//         duration: 120,
//       },
//     ],
//     comments: []
//   },
//   {
//     _id: '5',
//     title: 'Edit Product Demo Video',
//     description: 'Final editing and color correction for the product demonstration video',
//     status: 'todo',
//     priority: 'high',
//     assignee: '2',
//     createdAt: '2024-01-15T15:00:00Z',
//     updatedAt: '2024-01-15T15:00:00Z',
//     dueDate: '2024-01-17T17:00:00Z',
//     timeSpent: 0,
//     isTimerRunning: false,
//     tags: ['video', 'editing', 'product'],
//     workSessions: [],
//     comments: []
//   },
//   {
//     _id: '6',
//     title: 'Create Website Banners',
//     description: 'Design promotional banners for the homepage and landing pages',
//     status: 'todo',
//     priority: 'medium',
//     assignee: '3',
//     createdAt: '2024-01-15T16:00:00Z',
//     updatedAt: '2024-01-15T16:00:00Z',
//     dueDate: '2024-01-22T17:00:00Z',
//     timeSpent: 0,
//     isTimerRunning: false,
//     tags: ['design', 'web', 'banners'],
//     workSessions: [],
//     comments: []
//   },
// ;