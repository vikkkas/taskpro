# Task Assignment Migration Guide

This guide explains the migration from single assignee to multiple assignees support in your CRM system.

## What Changed

### Backend Changes
1. **Task Schema**: Added `assignees` array field while keeping `assignee` field for backward compatibility
2. **Work Sessions**: Added `userId` field to track which user worked on each session
3. **Timer Tracking**: Added `timerStartedBy` field to track who started the timer
4. **Role-based Permissions**: 
   - Team members can only start/stop timers for tasks assigned to them
   - Team members can only update status for tasks assigned to them
   - Admins have full access to all tasks and timers

### Frontend Changes
1. **Multi-select Component**: Added support for selecting multiple team members
2. **Task Card**: Updated to display multiple assignees
3. **Active Timers Dashboard**: New admin-only view to monitor all running timers
4. **Role-based UI**: Different interfaces for admins vs team members

### New API Endpoints
- `GET /api/tasks/active-timers` - Get all active timers (Admin only)
- `GET /api/tasks/analytics` - Get task analytics (Admin only)
- `POST /api/tasks/migrate` - Run data migration (Admin only)

## Migration Process

### Option 1: Run Migration Script (Recommended)
```bash
cd backend
npm run migrate
```

### Option 2: Run Migration via API
Make a POST request to `/api/tasks/migrate` as an admin user.

### Option 3: Manual Script Execution
```bash
cd backend
node scripts/migrate.js
```

## What the Migration Does

1. **Converts Single Assignees**: Moves existing `assignee` values to `assignees` array
2. **Removes Duplicates**: Cleans up any duplicate assignees in the arrays
3. **Validates Data**: Ensures data integrity after migration
4. **Preserves Backward Compatibility**: Keeps existing `assignee` field intact

## User Roles and Permissions

### Admin Users
- ✅ Create and assign tasks to multiple team members
- ✅ Edit any task (title, description, assignees, etc.)
- ✅ Start/stop timers on any task
- ✅ View all active timers across the organization
- ✅ Access task analytics and team management
- ✅ Delete tasks

### Team Member Users
- ❌ Cannot create tasks (only admins can create)
- ❌ Cannot edit task details (title, description, assignees)
- ✅ Can update task status (todo → in-progress → completed) for assigned tasks only
- ✅ Can start/stop timers for tasks assigned to them only
- ✅ Can add comments to tasks they're involved with
- ❌ Cannot see active timers of other team members
- ❌ Cannot access analytics or team management

## Key Features

### Multiple Assignees
- Tasks can now be assigned to multiple team members
- Each team member can work on the task and track their time
- Backward compatibility maintained with existing single assignee tasks

### Timer Management
- Team members can only control timers for their assigned tasks
- Admins can stop any running timer
- Track who started each timer session
- Individual work sessions are tracked per user

### Admin Dashboard
- **Active Timers**: Real-time view of all running timers
- **Analytics**: Task completion rates, overdue tasks, workload distribution
- **Team Management**: User management and role assignment

## Database Schema Changes

### Task Model Updates
```javascript
// New fields added:
assignees: [{ type: ObjectId, ref: 'User' }]  // Multiple assignees
timerStartedBy: { type: ObjectId, ref: 'User' }  // Who started timer

// Work session schema updated:
workSessions: [{
  startTime: Date,
  endTime: Date,
  duration: Number,
  userId: { type: ObjectId, ref: 'User' }  // Who worked this session
}]
```

## Testing the Migration

After running the migration, verify:

1. **Existing Tasks**: All tasks with single assignee now have that user in `assignees` array
2. **Task Assignment**: Can assign tasks to multiple users via admin interface
3. **Timer Controls**: Team members can only control timers for their assigned tasks
4. **Admin Features**: Active timers dashboard shows all running timers
5. **Permissions**: Team members cannot edit task details, only status updates

## Troubleshooting

### Migration Issues
- Ensure MongoDB connection is stable during migration
- Check console logs for detailed migration progress
- Use validation endpoint to verify data integrity

### Permission Issues
- Verify user roles are correctly set in the database
- Check that JWT tokens include the correct role information
- Ensure middleware is properly applied to routes

### Timer Issues
- Confirm `timerStartedBy` field is populated for new timer sessions
- Check that timer permissions respect user assignments
- Verify active timers API returns proper user information

## Rollback Plan

If you need to rollback:
1. The `assignee` field is preserved, so single assignee functionality still works
2. You can temporarily disable multiple assignee UI components
3. Database changes are additive and don't break existing functionality

## Support

If you encounter issues during migration:
1. Check the console logs for detailed error messages
2. Verify your MongoDB connection and permissions
3. Ensure all dependencies are up to date
4. Run the validation script to check data integrity
