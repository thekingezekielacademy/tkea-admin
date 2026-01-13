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

interface PurchaseConfirmationEmailParams {
  email: string;
  name: string;
  productType: 'course' | 'learning_path';
  productTitle: string;
  productUrl: string;
}

interface PurchaseAccessEmailParams {
  name: string;
  email: string;
  courseName: string;
  purchasePrice: number; // Price in kobo (will be divided by 100 in template)
  purchaseDate: string;
  accessLink: string;
  purchaseId: string;
}

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
 * Get API base URL
 * Uses environment variable if set, otherwise uses current origin
 */
const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  
  // Check for explicit API URL in environment
  const apiUrl = process.env?.REACT_APP_API_URL || 
                 (window as any).__API_URL__;
  
  if (apiUrl) {
    return apiUrl;
  }
  
  // Default to same origin (relative URL)
  return window.location.origin;
};

/**
 * Send email via backend API endpoint (to avoid CORS issues)
 * The backend API will handle the Resend API call server-side
 */
const sendEmailViaResend = async ({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const apiUrl = `${apiBaseUrl}/api/send-email`;
    
    console.log('[emailService] Sending email via API:', { apiUrl, to, subject });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[emailService] API error:', data);
      return { success: false, error: data.error || 'Failed to send email' };
    }

    if (!data.success) {
      console.error('[emailService] API returned error:', data);
      return { success: false, error: data.error || 'Failed to send email' };
    }

    console.log('[emailService] Email sent successfully via API:', data);
    return { success: true };
  } catch (error) {
    console.error('[emailService] Error sending email via API:', error);
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
 * Generate purchase confirmation email template
 * Sent when user purchases a course/learning path (or admin grants access)
 */
const getPurchaseConfirmationEmailTemplate = ({
  name,
  productTitle,
  productUrl,
  productType,
}: PurchaseConfirmationEmailParams): string => {
  const productTypeLabel = productType === 'course' ? 'Course' : 'Learning Path';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Confirmation - ${productTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Purchase Confirmed!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      Great news! You now have access to your new ${productTypeLabel.toLowerCase()}:
    </p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
      <h2 style="color: #333; margin-top: 0; font-size: 22px; font-weight: bold;">${productTitle}</h2>
      <p style="color: #666; margin-bottom: 0;">Access granted and ready to start learning!</p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${productUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Start Learning</a>
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
  
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
    <p>© ${new Date().getFullYear()} King Ezekiel Academy. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generate purchase access email template
 * Sent after successful purchase with access link, resale rights info, and sign-in encouragement
 */
const getPurchaseAccessEmailTemplate = ({
  name,
  courseName,
  purchasePrice,
  purchaseDate,
  accessLink
}: PurchaseAccessEmailParams): string => {
  const appUrl = window.location.origin;
  const APP_NAME = 'The King Ezekiel Academy';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Course Access - ${courseName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Purchase Confirmed!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      Thank you for your purchase! Your course is ready for you.
    </p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
      <h2 style="color: #333; margin-top: 0; font-size: 22px; font-weight: bold;">${courseName}</h2>
      <p style="color: #666; margin-bottom: 10px;"><strong>Price:</strong> ₦${(purchasePrice / 100).toLocaleString()}</p>
      <p style="color: #666; margin-bottom: 0;"><strong>Purchase Date:</strong> ${purchaseDate}</p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${accessLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Access Your Course Now</a>
    </div>
    
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ffc107;">
      <p style="font-size: 15px; color: #856404; margin: 0 0 10px 0; font-weight: bold;">💡 Sign In for Better Access</p>
      <p style="font-size: 14px; color: #856404; margin: 0;">
        If you haven't signed in yet, we recommend creating an account or signing in with the same email address you used for this purchase. This will link your purchase to your account, giving you permanent access that you can manage from your dashboard anytime.
      </p>
      <div style="text-align: center; margin-top: 15px;">
        <a href="${appUrl}/signin" style="color: #856404; text-decoration: underline; font-weight: bold;">Sign In or Create Account →</a>
      </div>
    </div>
    
    <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #0c5460;">
      <p style="font-size: 15px; color: #0c5460; margin: 0 0 10px 0; font-weight: bold;">💰 Resale Rights Included!</p>
      <p style="font-size: 14px; color: #0c5460; margin: 0 0 15px 0;">
        <strong>Great news!</strong> You have full resale rights to this course. You can resell it and keep 100% of the profits!
      </p>
      <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <p style="font-size: 13px; color: #0c5460; margin: 0 0 10px 0; font-weight: bold;">How to Resell:</p>
        <ol style="font-size: 13px; color: #0c5460; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Share your unique access link with your customers</li>
          <li style="margin-bottom: 8px;">Set your own price - you keep 100% of the profit</li>
          <li style="margin-bottom: 8px;">Your customers get lifetime access to the course</li>
          <li>You can resell unlimited times - no restrictions!</li>
        </ol>
      </div>
      <p style="font-size: 13px; color: #0c5460; margin: 15px 0 0 0; font-style: italic;">
        💡 Tip: Use your access link above to share with customers. Each purchase gets their own unique access link.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #555; margin-top: 30px;">
      This link gives you <strong>lifetime access</strong> to your course. You can use it anytime to access your content.
    </p>
    
    <p style="font-size: 14px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      Need help? Contact us at 
      <a href="mailto:info@thekingezekielacademy.com" style="color: #667eea;">info@thekingezekielacademy.com</a>
    </p>
    
    <p style="font-size: 14px; color: #888; margin-top: 10px;">
      Best regards,<br>
      ${APP_NAME}
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
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
   * Send purchase confirmation email
   * Sent when user purchases a course/learning path or admin grants access
   */
  async sendPurchaseConfirmationEmail(
    params: PurchaseConfirmationEmailParams
  ): Promise<{ success: boolean; error?: string }> {
    const html = getPurchaseConfirmationEmailTemplate(params);
    return sendEmailViaResend({
      to: params.email,
      subject: `🎉 Access Granted: ${params.productTitle}`,
      html,
    });
  },

  /**
   * Send post-purchase access email with access link, resale rights info, and sign-in encouragement
   * This is the comprehensive purchase email sent when admin adds course to library or after successful purchase
   */
  async sendPurchaseAccessEmail(
    params: PurchaseAccessEmailParams
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[emailService] Sending purchase access email:', { email: params.email, courseName: params.courseName, purchaseId: params.purchaseId });
    const html = getPurchaseAccessEmailTemplate(params);
    return sendEmailViaResend({
      to: params.email,
      subject: `Your Course Access - ${params.courseName}`,
      html,
    });
  },

  /**
   * Check if email service is configured
   * Since we use a backend API, we assume it's configured if we're in a browser environment
   * The actual configuration check happens on the backend
   */
  isConfigured(): boolean {
    return typeof window !== 'undefined';
  },
};

