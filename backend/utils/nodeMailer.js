const nodemailer = require('nodemailer')
require('dotenv').config()

async function sendEmail(emailId,subject, text, html) {
  const name = "vikas"
  const email = "prasad@gmal.com"
  const message = "test email from taskpro"

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
    return { message: "SMTP configuration error. Please check your settings." }
  }

  try {
    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER, // Use SMTP_USER instead of SMTP_FROM
      to: emailId,
      subject: subject,
      text: `
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    })

    return { message: "Email sent successfully!",
            success: true
     }
  } catch (error) {
    console.error("Error sending email:", error)
    return { message: "Failed to send email. Please try again later." }
  }
}


module.exports = sendEmail;