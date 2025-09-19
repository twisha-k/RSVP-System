const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to EventHub!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6; text-align: center;">Welcome to EventHub!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining EventHub! We're excited to have you as part of our community.</p>
        <p>You can now:</p>
        <ul>
          <li>Create and manage events</li>
          <li>RSVP to exciting events in your area</li>
          <li>Connect with like-minded people</li>
          <li>Discover new experiences</li>
        </ul>
        <p>Get started by exploring events in your area or creating your first event!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Explore Events</a>
        </div>
        <p>Best regards,<br>The EventHub Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, name) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request - EventHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6; text-align: center;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>You recently requested to reset your password for your EventHub account. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
        </div>
        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>Best regards,<br>The EventHub Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send event notification email
const sendEventNotificationEmail = async (email, name, event, type) => {
  const transporter = createTransporter();
  let subject, content;
  
  switch (type) {
    case 'rsvp_confirmation':
      subject = `RSVP Confirmed - ${event.title}`;
      content = `
        <h1 style="color: #3b82f6;">RSVP Confirmed!</h1>
        <p>Hi ${name},</p>
        <p>Your RSVP for <strong>${event.title}</strong> has been confirmed!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${event.title}</h3>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${event.time.start} - ${event.time.end}</p>
          <p><strong>Location:</strong> ${event.location.address}, ${event.location.city}</p>
        </div>
        <p>We look forward to seeing you there!</p>
      `;
      break;
    case 'event_reminder':
      subject = `Event Reminder - ${event.title} is tomorrow!`;
      content = `
        <h1 style="color: #3b82f6;">Event Reminder</h1>
        <p>Hi ${name},</p>
        <p>This is a friendly reminder that <strong>${event.title}</strong> is happening tomorrow!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${event.title}</h3>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${event.time.start} - ${event.time.end}</p>
          <p><strong>Location:</strong> ${event.location.address}, ${event.location.city}</p>
        </div>
        <p>Don't forget to attend! See you there.</p>
      `;
      break;
    case 'event_update':
      subject = `Event Update - ${event.title}`;
      content = `
        <h1 style="color: #3b82f6;">Event Update</h1>
        <p>Hi ${name},</p>
        <p>There has been an update to <strong>${event.title}</strong> that you're attending.</p>
        <p>Please check the event details for the latest information.</p>
      `;
      break;
    default:
      return;
  }
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${content}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/events/${event._id}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Event</a>
        </div>
        <p>Best regards,<br>The EventHub Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Event notification email sent successfully (${type})`);
  } catch (error) {
    console.error('Error sending event notification email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEventNotificationEmail,
};