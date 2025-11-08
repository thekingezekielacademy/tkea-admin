import { Resend } from 'resend'
import { env } from '@/lib/env'

// Initialize Resend client
const resend = new Resend(env.RESEND_API_KEY)

const FROM_EMAIL = env.RESEND_FROM_EMAIL || 'noreply@thekingezekielacademy.com'
const APP_NAME = 'King Ezekiel Academy'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thekingezekielacademy.com'

interface WelcomeEmailProps {
  name: string
  email: string
}

interface CourseAvailableEmailProps {
  name: string
  email: string
  courseTitle: string
  courseId: string
}

/**
 * Welcome email template - sent when user signs up
 */
function getWelcomeEmailTemplate({ name }: WelcomeEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${APP_NAME}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${APP_NAME}!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      We're thrilled to have you join our community! You've taken the first step towards transforming your skills and advancing your career.
    </p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h2 style="color: #667eea; margin-top: 0; font-size: 20px;">What's Next?</h2>
      <ul style="color: #555; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Explore our courses and start learning</li>
        <li style="margin-bottom: 10px;">Complete your profile to personalize your experience</li>
        <li style="margin-bottom: 10px;">Join our community and connect with other learners</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${APP_URL}/courses" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Browse Courses</a>
    </div>
    
    <p style="font-size: 14px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      If you have any questions, feel free to reach out to us at 
      <a href="mailto:support@thekingezekielacademy.com" style="color: #667eea;">support@thekingezekielacademy.com</a>
    </p>
    
    <p style="font-size: 14px; color: #888; margin-top: 10px;">
      Happy learning!<br>
      The ${APP_NAME} Team
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Course available email template - sent when a course becomes available
 */
function getCourseAvailableEmailTemplate({ name, courseTitle, courseId }: CourseAvailableEmailProps): string {
  const courseUrl = `${APP_URL}/course/${courseId}`
  
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
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Course Now Available!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      Great news! The course you requested to be notified about is now available:
    </p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
      <h2 style="color: #333; margin-top: 0; font-size: 22px; font-weight: bold;">${courseTitle}</h2>
      <p style="color: #666; margin-bottom: 0;">Ready to start your learning journey!</p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${courseUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">View Course</a>
    </div>
    
    <p style="font-size: 14px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      Need help? Contact us at 
      <a href="mailto:support@thekingezekielacademy.com" style="color: #667eea;">support@thekingezekielacademy.com</a>
    </p>
    
    <p style="font-size: 14px; color: #888; margin-top: 10px;">
      Happy learning!<br>
      The ${APP_NAME} Team
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Email service for sending transactional emails via Resend
 */
export const emailService = {
  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail({ name, email }: WelcomeEmailProps): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate Resend is configured
      if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 'placeholder') {
        console.warn('Resend API key not configured. Skipping welcome email.')
        return { success: false, error: 'Resend not configured' }
      }

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Welcome to ${APP_NAME}! 🎉`,
        html: getWelcomeEmailTemplate({ name, email }),
      })

      if (error) {
        console.error('Error sending welcome email:', error)
        return { success: false, error: error.message || 'Failed to send email' }
      }

      console.log('Welcome email sent successfully:', data)
      return { success: true }
    } catch (error) {
      console.error('Exception sending welcome email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  /**
   * Send course available notification email
   */
  async sendCourseAvailableEmail({ 
    name, 
    email, 
    courseTitle, 
    courseId 
  }: CourseAvailableEmailProps): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate Resend is configured
      if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 'placeholder') {
        console.warn('Resend API key not configured. Skipping course available email.')
        return { success: false, error: 'Resend not configured' }
      }

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `🎉 ${courseTitle} is Now Available!`,
        html: getCourseAvailableEmailTemplate({ name, email, courseTitle, courseId }),
      })

      if (error) {
        console.error('Error sending course available email:', error)
        return { success: false, error: error.message || 'Failed to send email' }
      }

      console.log('Course available email sent successfully:', data)
      return { success: true }
    } catch (error) {
      console.error('Exception sending course available email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  /**
   * Test Resend configuration
   */
  async testConfiguration(): Promise<{ configured: boolean; error?: string }> {
    try {
      if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 'placeholder') {
        return { configured: false, error: 'RESEND_API_KEY not set' }
      }

      // Try to send a test email (optional - can be removed if not needed)
      return { configured: true }
    } catch (error) {
      return { 
        configured: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },
}

