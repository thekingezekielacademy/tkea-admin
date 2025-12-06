/**
 * Email service for sending transactional emails via Resend
 * This service sends emails when courses are published or scheduled
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface CourseNotificationParams {
  name: string;
  email: string;
  courseTitle: string;
  courseId: string;
  courseUrl?: string;
}

/**
 * Get Resend API key from environment variables
 * Supports Create React App (REACT_APP_) prefix
 */
const getResendApiKey = (): string | null => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return null;
  
  // Try to get from environment (if set via build-time)
  // Priority: REACT_APP_ (CRA) > window global
  const apiKey = process.env?.REACT_APP_RESEND_API_KEY ||
                 (window as any).__RESEND_API_KEY__;
  
  return apiKey || null;
};

/**
 * Get Resend from email
 * Supports Create React App (REACT_APP_) prefix
 */
const getFromEmail = (): string => {
  const fromEmail = process.env?.REACT_APP_RESEND_FROM_EMAIL ||
                    (window as any).__RESEND_FROM_EMAIL__ ||
                    'noreply@thekingezekielacademy.com';
  
  return fromEmail;
};

/**
 * Send email via Resend API
 */
const sendEmailViaResend = async ({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> => {
  const apiKey = getResendApiKey();
  
  if (!apiKey) {
    console.warn('Resend API key not configured. Email will not be sent.');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log('Email sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Generate course available email template
 */
const getCourseAvailableEmailTemplate = ({ name, courseTitle, courseId, courseUrl }: CourseNotificationParams): string => {
  const appUrl = window.location.origin;
  const url = courseUrl || `${appUrl}/course/${courseId}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Course Available - ${courseTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Course Available!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      We're excited to announce a new course is now available:
    </p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
      <h2 style="color: #333; margin-top: 0; font-size: 22px; font-weight: bold;">${courseTitle}</h2>
      <p style="color: #666; margin-bottom: 0;">Ready to start your learning journey!</p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">View Course</a>
    </div>
    
    <p style="font-size: 14px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      Need help? Contact us at 
      <a href="mailto:support@thekingezekielacademy.com" style="color: #667eea;">support@thekingezekielacademy.com</a>
    </p>
    
    <p style="font-size: 14px; color: #888; margin-top: 10px;">
      Happy learning!<br>
      The King Ezekiel Academy Team
    </p>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generate course scheduled email template
 */
const getCourseScheduledEmailTemplate = ({ name, courseTitle, courseId, scheduledDate, courseUrl }: CourseNotificationParams & { scheduledDate?: string }): string => {
  const appUrl = window.location.origin;
  const url = courseUrl || `${appUrl}/course/${courseId}`;
  const dateText = scheduledDate ? ` on ${new Date(scheduledDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}` : '';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Scheduled - ${courseTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📅 Course Coming Soon!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      We wanted to let you know about an upcoming course${dateText ? ` that will be available${dateText}` : ' coming soon'}:
    </p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f5576c;">
      <h2 style="color: #333; margin-top: 0; font-size: 22px; font-weight: bold;">${courseTitle}</h2>
      ${scheduledDate ? `<p style="color: #666; margin-bottom: 0;">Available ${new Date(scheduledDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>` : '<p style="color: #666; margin-bottom: 0;">Coming soon!</p>'}
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${url}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">View Course Details</a>
    </div>
    
    <p style="font-size: 14px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      Need help? Contact us at 
      <a href="mailto:support@thekingezekielacademy.com" style="color: #f5576c;">support@thekingezekielacademy.com</a>
    </p>
    
    <p style="font-size: 14px; color: #888; margin-top: 10px;">
      Happy learning!<br>
      The King Ezekiel Academy Team
    </p>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Email service for sending course notifications
 */
export const emailService = {
  /**
   * Send course available notification email
   */
  async sendCourseAvailableEmail(params: CourseNotificationParams): Promise<{ success: boolean; error?: string }> {
    const html = getCourseAvailableEmailTemplate(params);
    return sendEmailViaResend({
      to: params.email,
      subject: `🎉 ${params.courseTitle} is Now Available!`,
      html,
    });
  },

  /**
   * Send course scheduled notification email
   */
  async sendCourseScheduledEmail(params: CourseNotificationParams & { scheduledDate?: string }): Promise<{ success: boolean; error?: string }> {
    const html = getCourseScheduledEmailTemplate(params);
    return sendEmailViaResend({
      to: params.email,
      subject: `📅 ${params.courseTitle} - Coming Soon!`,
      html,
    });
  },

  /**
   * Check if Resend is configured
   */
  isConfigured(): boolean {
    return getResendApiKey() !== null;
  },
};

