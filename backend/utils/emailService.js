const nodemailer = require('nodemailer')
const emailTemplateRenderer = require('./emailTemplateRenderer')
require('dotenv').config()

/**
 * Send email using nodemailer with HTML template support
 * @param {string} emailId - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text fallback
 * @param {string} html - HTML content (optional, will use text if not provided)
 * @returns {object} - Success/error response
 */
async function sendEmail(emailId, subject, text, html) {
  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  
  // Verify the connection
  try {
    await transporter.verify()
  } catch (verifyError) {
    console.error('SMTP verification error:', verifyError)
    return { 
      message: "SMTP configuration error. Please check your settings.",
      success: false 
    }
  }

  try {
    // Send email
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.SMTP_USER}>`,
      to: emailId,
      subject: subject,
      text: text,
      html: html || text,
    })

    return { 
      message: "Email sent successfully!",
      success: true
    }
  } catch (error) {
    console.error("Error sending email:", error)
    return { 
      message: "Failed to send email. Please try again later.",
      success: false 
    }
  }
}

/**
 * Send welcome email to new user
 * @param {object} userData - User data
 * @returns {object} - Success/error response
 */
async function sendWelcomeEmail(userData) {
  try {
    const html = emailTemplateRenderer.renderWelcomeEmail(userData)
    const text = `Welcome to TaskFlow, ${userData.name}! Your account has been created successfully.`
    
    return await sendEmail(
      userData.email,
      'Welcome to TaskFlow - Your Account is Ready!',
      text,
      html
    )
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return {
      message: "Failed to send welcome email.",
      success: false
    }
  }
}

/**
 * Send task assigned email
 * @param {object} taskData - Task data
 * @param {object} assigneeData - Assignee data
 * @param {object} assignerData - Assigner data (optional)
 * @returns {object} - Success/error response
 */
async function sendTaskAssignedEmail(taskData, assigneeData, assignerData = null) {
  try {
    const html = emailTemplateRenderer.renderTaskAssignedEmail(taskData, assigneeData, assignerData)
    const text = `You have been assigned a new task: ${taskData.title}`
    
    return await sendEmail(
      assigneeData.email,
      `New Task Assigned: ${taskData.title}`,
      text,
      html
    )
  } catch (error) {
    console.error('Error sending task assigned email:', error)
    return {
      message: "Failed to send task assigned email.",
      success: false
    }
  }
}

/**
 * Send task update email
 * @param {object} taskData - Task data
 * @param {object} updaterData - Updater data
 * @param {object} recipientData - Recipient data
 * @returns {object} - Success/error response
 */
async function sendTaskUpdateEmail(taskData, updaterData, recipientData) {
  try {
    const html = emailTemplateRenderer.renderTaskUpdateEmail(taskData, updaterData, recipientData)
    const text = `Task "${taskData.title}" has been updated.`
    
    return await sendEmail(
      recipientData.email,
      `Task Update: ${taskData.title}`,
      text,
      html
    )
  } catch (error) {
    console.error('Error sending task update email:', error)
    return {
      message: "Failed to send task update email.",
      success: false
    }
  }
}

/**
 * Send task completed email
 * @param {object} taskData - Task data
 * @param {object} completedByData - User who completed the task
 * @param {object} recipientData - Recipient data
 * @param {object} stats - Completion statistics (optional)
 * @returns {object} - Success/error response
 */
async function sendTaskCompletedEmail(taskData, completedByData, recipientData, stats = {}) {
  try {
    const html = emailTemplateRenderer.renderTaskCompletedEmail(taskData, completedByData, recipientData, stats)
    const text = `Task "${taskData.title}" has been completed by ${completedByData.name}.`
    
    return await sendEmail(
      recipientData.email,
      `Task Completed: ${taskData.title}`,
      text,
      html
    )
  } catch (error) {
    console.error('Error sending task completed email:', error)
    return {
      message: "Failed to send task completed email.",
      success: false
    }
  }
}

/**
 * Send task comment email
 * @param {object} taskData - Task data
 * @param {object} commentData - Comment data
 * @param {object} commentAuthorData - Comment author data
 * @param {object} recipientData - Recipient data
 * @returns {object} - Success/error response
 */
async function sendTaskCommentEmail(taskData, commentData, commentAuthorData, recipientData) {
  try {
    const html = emailTemplateRenderer.renderTaskCommentEmail(taskData, commentData, commentAuthorData, recipientData)
    const text = `${commentAuthorData.name} commented on task "${taskData.title}": ${commentData.content.substring(0, 100)}${commentData.content.length > 100 ? '...' : ''}`
    
    return await sendEmail(
      recipientData.email,
      `New Comment on: ${taskData.title}`,
      text,
      html
    )
  } catch (error) {
    console.error('Error sending task comment email:', error)
    return {
      message: "Failed to send task comment email.",
      success: false
    }
  }
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTaskAssignedEmail,
  sendTaskUpdateEmail,
  sendTaskCompletedEmail,
  sendTaskCommentEmail
};
