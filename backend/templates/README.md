# TaskFlow Email Templates Documentation

This document provides information about the beautiful HTML email templates created for the TaskFlow application.

## Overview

The email system includes professionally designed, responsive HTML email templates for various scenarios:

1. **Welcome Email** - Sent when a new user is registered
2. **Task Assigned Email** - Sent when a task is assigned to a user
3. **Task Update Email** - Sent when a task is updated
4. **Task Completed Email** - Sent when a task is marked as completed

## File Structure

```
backend/
├── templates/
│   └── emails/
│       ├── base.html              # Base template (not used directly)
│       ├── welcome.html           # Welcome email template
│       ├── task-assigned.html     # Task assignment template
│       ├── task-update.html       # Task update template
│       └── task-completed.html    # Task completion template
├── utils/
│   ├── emailService.js           # Main email service with template functions
│   ├── emailTemplateRenderer.js  # Template rendering utility
│   └── nodeMailer.js            # Original nodemailer (kept for reference)
```

## Features

### Design Features
- **Modern, professional design** with gradient headers
- **Fully responsive** - looks great on desktop and mobile
- **Consistent branding** with TaskFlow colors and styling
- **Clear visual hierarchy** with proper typography
- **Interactive elements** with hover effects on buttons
- **Status badges** with color-coded priority and status indicators
- **Social media integration** ready for future use

### Technical Features
- **Template inheritance** system for consistent layouts
- **Dynamic content injection** using placeholder variables
- **Conditional content blocks** for showing/hiding sections
- **Loop support** for dynamic lists (like task changes)
- **Fallback text** versions for email clients that don't support HTML
- **Error handling** and logging

## Usage Examples

### 1. Welcome Email

```javascript
const { sendWelcomeEmail } = require('../utils/emailService');

// Send welcome email to new user
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'team-member',
  department: 'Development',
  showCredentials: true, // Show temporary password
  tempPassword: 'TempPass123'
};

const result = await sendWelcomeEmail(userData);
```

### 2. Task Assigned Email

```javascript
const { sendTaskAssignedEmail } = require('../utils/emailService');

const taskData = {
  _id: 'task123',
  title: 'Implement user authentication',
  description: 'Create login and registration functionality',
  status: 'todo',
  priority: 'high',
  dueDate: new Date('2025-09-01'),
  project: 'TaskFlow Web App'
};

const assigneeData = {
  name: 'Jane Smith',
  email: 'jane@example.com'
};

const assignerData = {
  name: 'Project Manager',
  role: 'project-manager'
};

const result = await sendTaskAssignedEmail(taskData, assigneeData, assignerData);
```

### 3. Task Update Email

```javascript
const { sendTaskUpdateEmail } = require('../utils/emailService');

const taskData = {
  _id: 'task123',
  title: 'Implement user authentication',
  status: 'in-progress',
  priority: 'high',
  dueDate: new Date('2025-09-01'),
  assignedTo: { name: 'Jane Smith' },
  updateComment: 'Started working on the authentication module'
};

const changes = [
  {
    field: 'Status',
    oldValue: 'To Do',
    newValue: 'In Progress'
  },
  {
    field: 'Priority',
    oldValue: 'Medium',
    newValue: 'High'
  }
];

const updaterData = {
  name: 'Jane Smith',
  role: 'team-member'
};

const recipientData = {
  name: 'Project Manager',
  email: 'pm@example.com'
};

const result = await sendTaskUpdateEmail(taskData, changes, updaterData, recipientData);
```

### 4. Task Completed Email

```javascript
const { sendTaskCompletedEmail } = require('../utils/emailService');

const taskData = {
  _id: 'task123',
  title: 'Implement user authentication',
  description: 'Create login and registration functionality',
  dueDate: new Date('2025-09-01'),
  project: 'TaskFlow Web App',
  completedAt: new Date(),
  completionComment: 'Authentication module completed successfully with all test cases passing'
};

const completedByData = {
  name: 'Jane Smith',
  role: 'team-member'
};

const recipientData = {
  name: 'Project Manager',
  email: 'pm@example.com'
};

const stats = {
  show: true,
  timeSpent: '12h',
  daysAhead: 2,
  tasksCompleted: 3
};

const result = await sendTaskCompletedEmail(taskData, completedByData, recipientData, stats);
```

## Template Variables

### Common Variables (Available in all templates)
- `https://tasks.divinermedia.com/` - Link to dashboard
- `{{supportUrl}}` - Link to support page
- `{{settingsUrl}}` - Link to notification settings
- `{{helpUrl}}` - Link to help center
- `{{unsubscribeUrl}}` - Link to unsubscribe
- `{{currentYear}}` - Current year for copyright

### Welcome Email Variables
- `{{userName}}` - User's full name
- `{{userEmail}}` - User's email address
- `{{userRole}}` - User's role (formatted)
- `{{userDepartment}}` - User's department
- `{{showCredentials}}` - Boolean to show/hide credentials section
- `{{tempPassword}}` - Temporary password (if provided)

### Task Email Variables
- `{{taskTitle}}` - Task title
- `{{taskDescription}}` - Task description
- `{{taskStatus}}` - Task status (CSS class format)
- `{{taskStatusDisplay}}` - Task status (display format)
- `{{taskPriority}}` - Task priority (CSS class format)
- `{{taskPriorityDisplay}}` - Task priority (display format)
- `{{taskDueDate}}` - Formatted due date
- `https://tasks.divinermedia.com/` - Direct link to task
- `{{assigneeName}}` - Name of assigned user
- `{{assignerName}}` - Name of user who assigned the task

## Customization

### Colors and Branding
The templates use CSS custom properties that can be easily modified:

```css
:root {
  --primary-color: #667eea;
  --primary-dark: #764ba2;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #dc2626;
}
```

### Adding New Templates
1. Create a new HTML file in `backend/templates/emails/`
2. Use the base template structure for consistency
3. Add rendering method to `emailTemplateRenderer.js`
4. Add sending method to `emailService.js`

### Environment Variables
Make sure these environment variables are set:

```env
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
FRONTEND_URL=http://localhost:3000
SUPPORT_URL=http://localhost:3000/support
HELP_URL=http://localhost:3000/help
SETTINGS_URL=http://localhost:3000/settings
UNSUBSCRIBE_URL=http://localhost:3000/unsubscribe
```

## Testing

To test email templates during development:

1. **Use a testing service** like Mailtrap or MailHog
2. **Preview in browser** by saving rendered HTML to a file
3. **Test responsive design** using browser dev tools
4. **Validate HTML** using online validators

## Best Practices

1. **Always provide fallback text** for HTML emails
2. **Test across different email clients** (Gmail, Outlook, Apple Mail, etc.)
3. **Keep file sizes reasonable** - optimize images and CSS
4. **Use inline CSS** for better email client compatibility
5. **Include unsubscribe links** for compliance
6. **Log email sending results** for debugging
7. **Handle errors gracefully** - don't let email failures break the app

## Troubleshooting

### Common Issues

1. **SMTP Configuration Errors**
   - Verify SMTP settings in environment variables
   - Check firewall and network settings
   - Ensure SMTP provider allows the connection

2. **Template Rendering Errors**
   - Check for missing template variables
   - Verify file paths are correct
   - Ensure template files have proper permissions

3. **Email Delivery Issues**
   - Check spam folders
   - Verify recipient email addresses
   - Monitor SMTP provider logs

4. **Responsive Design Issues**
   - Test in multiple email clients
   - Use email testing tools
   - Keep CSS simple and well-supported

## Future Enhancements

Potential improvements for the email system:

1. **Email Scheduling** - Schedule emails for optimal delivery times
2. **Email Analytics** - Track open rates, click-through rates
3. **Template A/B Testing** - Test different versions of templates
4. **Internationalization** - Support multiple languages
5. **Rich Text Editor** - Allow custom email content
6. **Email Templates Admin Panel** - Web interface for managing templates
7. **Attachment Support** - Send files with emails
8. **Bulk Email Support** - Send emails to multiple recipients efficiently
