# TaskPro Backend API

A comprehensive task management backend API built with Node.js, Express, and MongoDB. Features include time tracking, work sessions, comments, and role-based access control.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (admin, team-member)
  - Secure password hashing with bcrypt

- **Task Management**
  - CRUD operations for tasks
  - Task assignment and status tracking
  - Priority levels and due dates
  - Task archiving
  - Filtering and pagination
  - Advanced search functionality

- **Time Tracking**
  - Start/stop timer functionality
  - Work sessions tracking
  - Automatic time calculation
  - Time history per task

- **Comments System**
  - Add comments to tasks
  - Admin remarks highlighting
  - Comment management

- **User Management**
  - User registration and login
  - Profile management with avatar support
  - Department-based organization
  - Role-based permissions

## Project Structure

```
/backend
│
├── /config
│   └── db.js                  # MongoDB connection
│
├── /controllers
│   ├── authController.js      # Authentication & user logic
│   └── taskController.js      # Task management logic
│
├── /middleware
│   ├── authMiddleware.js      # JWT verification
│   └── roleMiddleware.js      # Role-based access control
│
├── /models
│   ├── User.js               # User schema with department & avatar
│   └── Task.js               # Task schema with time tracking & comments
│
├── /routes
│   ├── authRoutes.js         # Authentication routes
│   └── taskRoutes.js         # Task routes with timer & comments
│
├── /utils
│   └── generateToken.js      # JWT token generation
│
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
├── seeder.js                # Database seeding script
├── server.js                # Main server file
└── package.json             # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd taskpro/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Update the `.env` file with your configurations:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taskpro
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=30d
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Or use MongoDB Atlas connection string

5. **Seed the database** (optional)
   ```bash
   # Import sample data
   npm run seed
   
   # Clear all data
   npm run seed:destroy
   ```

6. **Run the application**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | User login | Public |
| GET | `/profile` | Get user profile | Private |
| PUT | `/profile` | Update user profile | Private |
| GET | `/users` | Get all users | Private |

### Task Routes (`/api/tasks`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all tasks (filtered by role) | Private |
| GET | `/:id` | Get single task | Private |
| POST | `/` | Create new task | Private |
| PUT | `/:id` | Update task | Private |
| DELETE | `/:id` | Delete task | Private |
| PUT | `/:id/archive` | Archive/Unarchive task | Private |

### Timer Routes (`/api/tasks`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/:id/timer/start` | Start timer for task | Private |
| POST | `/:id/timer/stop` | Stop timer for task | Private |

### Comment Routes (`/api/tasks`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/:id/comments` | Add comment to task | Private |
| DELETE | `/:id/comments/:commentId` | Delete comment | Private |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/health` | API health check | Public |

## Query Parameters

### GET /api/tasks

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by task status (todo, in-progress, completed)
- `priority`: Filter by priority (low, medium, high)
- `assignee`: Filter by assigned user ID
- `search`: Search in title and description
- `tags`: Filter by tags (can be array)
- `includeArchived`: Include archived tasks (true/false)

## Request/Response Examples

### Register User
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@digitalmedia.com",
  "password": "password123",
  "role": "team-member", // optional, defaults to "team-member"
  "department": "Development"
}
```

### Create Task
```javascript
POST /api/tasks
Headers: { "Authorization": "Bearer <token>" }
{
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation for the project",
  "priority": "high",
  "dueDate": "2025-08-15T10:00:00Z",
  "assignee": "user_id_here",
  "tags": ["documentation", "urgent"]
}
```

### Start Timer
```javascript
POST /api/tasks/:id/timer/start
Headers: { "Authorization": "Bearer <token>" }
```

### Add Comment
```javascript
POST /api/tasks/:id/comments
Headers: { "Authorization": "Bearer <token>" }
{
  "content": "This task is progressing well. Great work!"
}
```

## Data Models

### User Model
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: Enum ['admin', 'team-member']
- `department`: String
- `avatar`: String (auto-generated or custom URL)
- `isActive`: Boolean

### Task Model
- `title`: String (required)
- `description`: String
- `status`: Enum ['todo', 'in-progress', 'completed']
- `priority`: Enum ['low', 'medium', 'high']
- `assignee`: ObjectId (User reference)
- `createdBy`: ObjectId (User reference, required)
- `dueDate`: Date
- `timeSpent`: Number (total minutes)
- `isTimerRunning`: Boolean
- `timerStartedAt`: Date
- `tags`: Array of Strings
- `workSessions`: Array of WorkSession objects
- `comments`: Array of Comment objects
- `isArchived`: Boolean

### Work Session Schema
- `startTime`: Date (required)
- `endTime`: Date
- `duration`: Number (minutes)

### Comment Schema
- `content`: String (required)
- `authorId`: ObjectId (User reference)
- `authorName`: String
- `isAdminRemark`: Boolean

## User Roles

- **admin**: Full access to all tasks, can manage users, admin remarks on comments
- **team-member**: Can create, view, and manage their own tasks and assigned tasks

## Sample Data

The project includes a seeder script with sample users and tasks from a digital media company:

### Sample Users
- Sarah Chen (Admin, Management)
- Alex Rodriguez (Team Member, Video Production)
- Emma Thompson (Team Member, Graphic Design)
- Michael Johnson (Team Member, Social Media)
- Jessica Park (Team Member, Content Writing)

### Sample Tasks
- Instagram Campaign Video (in-progress)
- Brand Logo Variations (todo)
- Social Media Content Calendar (completed)
- Blog Post Series (in-progress with timer)
- Product Demo Video (todo)
- Website Banners (todo)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- Environment variable protection

## Error Handling

The API returns consistent error responses:
```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm run seed`: Import sample data
- `npm run seed:destroy`: Clear all data

## Technologies Used

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **express-validator**: Input validation
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.
