const fs = require('fs');
const path = require('path');

/**
 * Email Template Renderer
 * Provides functionality to render HTML email templates with dynamic data
 */
class EmailTemplateRenderer {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/emails');
  }

  /**
   * Load and render an email template
   * @param {string} templateName - Name of the template file (without .html extension)
   * @param {object} data - Data to inject into the template
   * @returns {string} - Rendered HTML content
   */
  renderTemplate(templateName, data = {}) {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${templateName}.html not found`);
      }

      let template = fs.readFileSync(templatePath, 'utf8');
      
      // Add default data
      const defaultData = {
        dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        supportUrl: process.env.SUPPORT_URL || 'http://localhost:3000/support',
        helpUrl: process.env.HELP_URL || 'http://localhost:3000/help',
        settingsUrl: process.env.SETTINGS_URL || 'http://localhost:3000/settings',
        unsubscribeUrl: process.env.UNSUBSCRIBE_URL || 'http://localhost:3000/unsubscribe',
        currentYear: new Date().getFullYear()
      };

      const mergedData = { ...defaultData, ...data };

      // Simple template rendering - replace {{variable}} with data
      template = this.replacePlaceholders(template, mergedData);

      return template;
    } catch (error) {
      console.error('Error rendering email template:', error);
      throw error;
    }
  }

  /**
   * Replace placeholders in template with actual data
   * @param {string} template - Template string
   * @param {object} data - Data object
   * @returns {string} - Template with replaced placeholders
   */
  replacePlaceholders(template, data) {
    // Handle conditional blocks {{#if condition}}...{{/if}} (nested support)
    let processedTemplate = template;
    let hasConditionals = true;
    
    while (hasConditionals) {
      const conditionalMatch = processedTemplate.match(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/);
      if (conditionalMatch) {
        const [fullMatch, condition, content] = conditionalMatch;
        const replacement = data[condition] ? this.replacePlaceholders(content, data) : '';
        processedTemplate = processedTemplate.replace(fullMatch, replacement);
      } else {
        hasConditionals = false;
      }
    }

    // Handle loops {{#each array}}...{{/each}}
    processedTemplate = processedTemplate.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => this.replacePlaceholders(content, { ...data, ...item })).join('');
    });

    // Handle simple {{variable}} replacements
    processedTemplate = processedTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : '';
    });

    return processedTemplate;
  }

  /**
   * Render welcome email template
   * @param {object} userData - User data
   * @returns {string} - Rendered HTML
   */
  renderWelcomeEmail(userData) {
    const data = {
      userName: userData.name,
      userEmail: userData.email,
      userRole: this.formatRole(userData.role),
      userDepartment: userData.department || 'Not specified',
      showCredentials: userData.showCredentials || false,
      tempPassword: userData.tempPassword || '',
      taskUrl: `${process.env.FRONTEND_URL}/tasks`
    };

    return this.renderTemplate('welcome', data);
  }

  /**
   * Render task assigned email template
   * @param {object} taskData - Task data
   * @param {object} assigneeData - Assignee data
   * @param {object} assignerData - Assigner data
   * @returns {string} - Rendered HTML
   */
  renderTaskAssignedEmail(taskData, assigneeData, assignerData = null) {
    const data = {
      assigneeName: assigneeData.name,
      taskTitle: taskData.title,
      taskDescription: taskData.description || '',
      taskStatus: taskData.status.toLowerCase().replace(/\s+/g, '-'),
      taskStatusDisplay: this.formatStatus(taskData.status),
      taskPriority: taskData.priority.toLowerCase(),
      taskPriorityDisplay: this.formatPriority(taskData.priority),
      taskDueDate: this.formatDate(taskData.dueDate),
      taskProject: taskData.project || 'General',
      assignerName: assignerData?.name || 'System',
      assignerRole: assignerData ? this.formatRole(assignerData.role) : 'Admin',
      taskUrl: `${process.env.FRONTEND_URL}/tasks/${taskData._id}`
    };

    return this.renderTemplate('task-assigned', data);
  }

  /**
   * Render task update email template
   * @param {object} taskData - Task data
   * @param {object} updaterData - Updater data
   * @param {object} recipientData - Recipient data
   * @returns {string} - Rendered HTML
   */
  renderTaskUpdateEmail(taskData, updaterData, recipientData) {
    const data = {
      recipientName: recipientData.name,
      recipientRole: this.getRecipientRole(recipientData, taskData),
      taskTitle: taskData.title,
      taskStatus: taskData.status.toLowerCase().replace(/\s+/g, '-'),
      taskStatusDisplay: this.formatStatus(taskData.status),
      taskPriority: taskData.priority.toLowerCase(),
      taskPriorityDisplay: this.formatPriority(taskData.priority),
      taskDueDate: this.formatDate(taskData.dueDate),
      taskAssignee: taskData.assignee?.name || 'Unassigned',
      updateComment: taskData.updateComment || '',
      updaterName: updaterData.name,
      updaterRole: this.formatRole(updaterData.role),
      updateTimestamp: this.formatDateTime(new Date()),
      taskUrl: `${process.env.FRONTEND_URL}/tasks/${taskData._id}`
    };

    return this.renderTemplate('task-update', data);
  }

  /**
   * Render task completed email template
   * @param {object} taskData - Task data
   * @param {object} completedByData - User who completed the task
   * @param {object} recipientData - Recipient data
   * @param {object} stats - Completion statistics
   * @returns {string} - Rendered HTML
   */
  renderTaskCompletedEmail(taskData, completedByData, recipientData, stats = {}) {
    const data = {
      recipientName: recipientData.name,
      taskTitle: taskData.title,
      taskDescription: taskData.description || '',
      completedBy: completedByData.name,
      completedByName: completedByData.name,
      completedByRole: this.formatRole(completedByData.role),
      taskDueDate: this.formatDate(taskData.dueDate),
      taskProject: taskData.project || 'General',
      completionTimestamp: this.formatDateTime(taskData.completedAt || new Date()),
      completionComment: taskData.completionComment || '',
      showStats: stats.show || false,
      timeSpent: stats.timeSpent || '0h',
      daysAhead: Math.abs(stats.daysAhead || 0),
      aheadOrBehind: (stats.daysAhead || 0) >= 0 ? 'Ahead' : 'Behind',
      tasksCompleted: stats.tasksCompleted || 0,
      taskUrl: `${process.env.FRONTEND_URL}/tasks/${taskData._id}`
    };

    return this.renderTemplate('task-completed', data);
  }

  /**
   * Render task comment email template
   * @param {object} taskData - Task data
   * @param {object} commentData - Comment data
   * @param {object} commentAuthorData - Comment author data
   * @param {object} recipientData - Recipient data
   * @returns {string} - Rendered HTML
   */
  renderTaskCommentEmail(taskData, commentData, commentAuthorData, recipientData) {
    const data = {
      recipientName: recipientData.name,
      recipientRole: this.getRecipientRole(recipientData, taskData),
      taskTitle: taskData.title,
      taskStatus: taskData.status.toLowerCase().replace(/\s+/g, '-'),
      taskStatusDisplay: this.formatStatus(taskData.status),
      taskPriority: taskData.priority.toLowerCase(),
      taskPriorityDisplay: this.formatPriority(taskData.priority),
      taskDueDate: this.formatDate(taskData.dueDate),
      taskAssignee: taskData.assignee?.name || 'Unassigned',
      commentAuthor: commentAuthorData.name,
      commentAuthorInitials: this.getInitials(commentAuthorData.name),
      commentContent: commentData.content,
      commentTimestamp: this.formatDateTime(commentData.createdAt || new Date()),
      isAdminComment: commentData.isAdminRemark || false,
      taskUrl: `${process.env.FRONTEND_URL}/tasks/${taskData._id}`
    };

    return this.renderTemplate('task-comment', data);
  }

  /**
   * Format user role for display
   * @param {string} role - User role
   * @returns {string} - Formatted role
   */
  formatRole(role) {
    const roleMap = {
      'admin': 'Administrator',
      'project-manager': 'Project Manager',
      'team-lead': 'Team Lead',
      'team-member': 'Team Member'
    };
    return roleMap[role] || role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format task status for display
   * @param {string} status - Task status
   * @returns {string} - Formatted status
   */
  formatStatus(status) {
    const statusMap = {
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'on-hold': 'On Hold'
    };
    return statusMap[status] || status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format task priority for display
   * @param {string} priority - Task priority
   * @returns {string} - Formatted priority
   */
  formatPriority(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @returns {string} - Formatted date
   */
  formatDate(date) {
    if (!date) return 'No due date';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format date and time for display
   * @param {Date|string} date - Date to format
   * @returns {string} - Formatted date and time
   */
  formatDateTime(date) {
    if (!date) return 'Unknown';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get recipient role in relation to the task
   * @param {object} recipient - Recipient data
   * @param {object} task - Task data
   * @returns {string} - Recipient role
   */
  getRecipientRole(recipient, task) {
    if (task.assignee && task.assignee._id.toString() === recipient._id.toString()) {
      return 'assigned to';
    }
    if (task.createdBy && task.createdBy._id.toString() === recipient._id.toString()) {
      return 'creator of';
    }
    return 'involved with';
  }

  /**
   * Get initials from a name
   * @param {string} name - Full name
   * @returns {string} - Initials
   */
  getInitials(name) {
    if (!name) return '?';
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }
}

module.exports = new EmailTemplateRenderer();
