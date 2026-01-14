import { Resend } from 'resend'
import { env } from '@/lib/env'

// Lazy initialization of Resend client to handle missing API key gracefully
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'placeholder') {
    return null;
  }
  if (!resend) {
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = env.RESEND_FROM_EMAIL || 'noreply@thekingezekielacademy.com'
const APP_NAME = 'The King Ezekiel Academy'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.thekingezekielacademy.com'

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

interface PurchaseAccessEmailProps {
  name: string
  email: string
  courseName: string
  purchasePrice: number
  purchaseDate: string
  accessLink: string
  purchaseId: string
}

interface BuildCommunityAccessEmailProps {
  name: string
  email: string
  purchaseDate: string
  libraryLink?: string
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
      <a href="mailto:info@thekingezekielacademy.com" style="color: #667eea;">info@thekingezekielacademy.com</a>
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
 * Purchase access email template - sent after successful purchase
 */
function getPurchaseAccessEmailTemplate({
  name,
  courseName,
  purchasePrice,
  purchaseDate,
  accessLink
}: PurchaseAccessEmailProps): string {
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
        <a href="${APP_URL}/signin" style="color: #856404; text-decoration: underline; font-weight: bold;">Sign In or Create Account →</a>
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
  `.trim()
}

/**
 * BUILD COMMUNITY access email template - sent when user joins BUILD COMMUNITY
 */
function getBuildCommunityAccessEmailTemplate({
  name,
  purchaseDate,
  libraryLink
}: BuildCommunityAccessEmailProps): string {
  const formattedDate = purchaseDate || new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to B.U.I.L.D COMMUNITY</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Welcome to B.U.I.L.D COMMUNITY!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      Thank you for joining the B.U.I.L.D COMMUNITY! You now have lifetime access to all our premium courses and live classes.
    </p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
      <h2 style="color: #333; margin-top: 0; font-size: 20px; font-weight: bold; margin-bottom: 15px;">🎯 WHAT YOU NOW HAVE ACCESS TO:</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; font-size: 16px; font-weight: bold; margin-bottom: 10px;">📚 COURSES (Access via Library):</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
            <strong>1. FREELANCING - THE UNTAPPED MARKET</strong>
          </li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
            <strong>2. INFORMATION MARKETING: THE INFINITE CASH LOOP</strong>
          </li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
            <strong>3. YOUTUBE MONETIZATION: From Setup To Monetization</strong>
          </li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
            <strong>4. EARN 500K SIDE INCOME SELLING EBOOKS</strong>
          </li>
          <li style="padding: 8px 0;">
            <strong>5. CPA MARKETING BLUEPRINT: TKEA RESELLERS</strong> <span style="color: #28a745;">(FREE)</span>
          </li>
        </ul>
        <div style="text-align: center; margin-top: 15px;">
          <a href="${libraryLink || `${APP_URL}/library`}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">View All Courses in Library</a>
        </div>
      </div>
      
      <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px;">
        <h3 style="color: #333; font-size: 16px; font-weight: bold; margin-bottom: 10px;">🎥 LIVE CLASSES:</h3>
        <p style="color: #666; margin-bottom: 15px;">
          Access to ALL live classes - Join scheduled sessions and learn in real-time with other students.
        </p>
        <div style="text-align: center;">
          <a href="${APP_URL}/live-classes" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">View Live Classes</a>
        </div>
      </div>
      
      <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px;">
        <h3 style="color: #333; font-size: 16px; font-weight: bold; margin-bottom: 10px;">💬 COMMUNITY ACCESS:</h3>
        <p style="color: #666; margin-bottom: 8px;">
          <strong>B.U.I.L.D COMMUNITY:</strong><br>
          <a href="https://t.me/+H6nI8QbGy1E0NGI0" style="color: #667eea; text-decoration: none;">Join Telegram Community →</a>
        </p>
        <p style="color: #666; margin-bottom: 0;">
          <strong>LIVE CLASS UPDATE CHANNEL:</strong><br>
          <a href="https://t.me/LIVECLASSREMINDER" style="color: #667eea; text-decoration: none;">Join Update Channel →</a>
        </p>
      </div>
    </div>
    
    <!-- BONUS: CHOOSE YOUR SKILL SECTION -->
    <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); padding: 30px; border-radius: 8px; margin: 30px 0; border: 3px solid #ffa500;">
      <h2 style="color: #333; margin-top: 0; font-size: 22px; font-weight: bold; margin-bottom: 15px; text-align: center;">🎁 BONUS: CHOOSE YOUR SKILL (FREE COURSE)</h2>
      
      <p style="font-size: 16px; color: #333; margin-bottom: 15px; text-align: center; font-weight: bold;">
        As a B.U.I.L.D COMMUNITY member, you get to choose ONE premium skill course absolutely FREE!
      </p>
      
      <p style="font-size: 14px; color: #555; margin-bottom: 20px; text-align: center;">
        This is a bonus course that will be added to your Library immediately.
      </p>
      
      <div style="background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="font-size: 14px; color: #d32f2f; margin: 0 0 15px 0; font-weight: bold; text-align: center;">
          ⚠️ IMPORTANT: You can only choose once. This selection cannot be changed, so choose wisely!
        </p>
        
        <p style="font-size: 15px; color: #333; margin-bottom: 10px; font-weight: bold;">Available Skills to Choose From:</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
            <strong>• META ANDROMEDA AI</strong>
          </li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
            <strong>• VIBE CODING</strong>
          </li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
            <strong>• BRANDING</strong>
          </li>
          <li style="padding: 8px 0; color: #333;">
            <strong>• GOOGLE ADS</strong>
          </li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 25px;">
        <a href="${APP_URL}/choose-skill" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🎯 Choose Your Skill Now</a>
      </div>
      
      <p style="font-size: 12px; color: #666; margin-top: 15px; text-align: center; font-style: italic;">
        Make sure you're signed in to access the skill selection page.
      </p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${APP_URL}/auth?redirect=/library" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Sign In to Access Library</a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      <strong>Purchase Date:</strong> ${formattedDate}
    </p>
    
    <p style="font-size: 14px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      Need help? Contact us at 
      <a href="mailto:support@thekingezekielacademy.com" style="color: #667eea;">support@thekingezekielacademy.com</a>
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
      const client = getResendClient();
      if (!client) {
        console.warn('[emailService] Resend API key not configured. Skipping welcome email.')
        return { success: false, error: 'Resend not configured' }
      }

      const { data, error } = await client.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Welcome to ${APP_NAME}! 🎉`,
        html: getWelcomeEmailTemplate({ name, email }),
      })

      if (error) {
        console.error('[emailService] Error sending welcome email:', error)
        return { success: false, error: error.message || 'Failed to send email' }
      }

      console.log('[emailService] Welcome email sent successfully:', data)
      return { success: true }
    } catch (error) {
      console.error('[emailService] Exception sending welcome email:', error)
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
      const client = getResendClient();
      if (!client) {
        console.warn('[emailService] Resend API key not configured. Skipping course available email.')
        return { success: false, error: 'Resend not configured' }
      }

      const { data, error } = await client.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `🎉 ${courseTitle} is Now Available!`,
        html: getCourseAvailableEmailTemplate({ name, email, courseTitle, courseId }),
      })

      if (error) {
        console.error('[emailService] Error sending course available email:', error)
        return { success: false, error: error.message || 'Failed to send email' }
      }

      console.log('[emailService] Course available email sent successfully:', data)
      return { success: true }
    } catch (error) {
      console.error('[emailService] Exception sending course available email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  /**
   * Send post-purchase access email with access link
   */
  async sendPurchaseAccessEmail({
    name,
    email,
    courseName,
    purchasePrice,
    purchaseDate,
    accessLink,
    purchaseId
  }: PurchaseAccessEmailProps): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate Resend is configured
      const client = getResendClient();
      if (!client) {
        console.warn('[emailService] Resend API key not configured. Skipping purchase access email.')
        return { success: false, error: 'Resend not configured' }
      }

      console.log('[emailService] Sending purchase access email:', { email, courseName, purchaseId });

      const { data, error } = await client.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Your Course Access - ${courseName}`,
        html: getPurchaseAccessEmailTemplate({
          name,
          courseName,
          purchasePrice,
          purchaseDate,
          accessLink
        }),
      })

      if (error) {
        console.error('[emailService] Error sending purchase access email:', error)
        return { success: false, error: error.message || 'Failed to send email' }
      }

      console.log('[emailService] Purchase access email sent successfully:', { email, courseName, purchaseId, data })
      return { success: true }
    } catch (error) {
      console.error('[emailService] Exception sending purchase access email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  /**
   * Send BUILD COMMUNITY access email with skill selection bonus
   */
  async sendBuildCommunityAccessEmail({
    name,
    email,
    purchaseDate,
    libraryLink
  }: BuildCommunityAccessEmailProps): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate Resend is configured
      const client = getResendClient();
      if (!client) {
        console.warn('[emailService] Resend API key not configured. Skipping BUILD COMMUNITY access email.')
        return { success: false, error: 'Resend not configured' }
      }

      console.log('[emailService] Sending BUILD COMMUNITY access email:', { email, name });

      const { data, error } = await client.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Welcome to B.U.I.L.D COMMUNITY - Your Access Details',
        html: getBuildCommunityAccessEmailTemplate({
          name,
          purchaseDate,
          libraryLink
        }),
      })

      if (error) {
        console.error('[emailService] Error sending BUILD COMMUNITY access email:', error)
        return { success: false, error: error.message || 'Failed to send email' }
      }

      console.log('[emailService] BUILD COMMUNITY access email sent successfully:', { email, name, data })
      return { success: true }
    } catch (error) {
      console.error('[emailService] Exception sending BUILD COMMUNITY access email:', error)
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

