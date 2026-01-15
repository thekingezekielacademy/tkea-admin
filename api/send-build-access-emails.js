export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { emailType, name, email, purchaseDate, libraryLink, careerPathLink } = req.body;

    // Validate required fields
    if (!emailType || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: emailType, email'
      });
    }

    // Get Resend API key from environment variables
    const apiKey = process.env.RESEND_API_KEY || process.env.REACT_APP_RESEND_API_KEY;
    
    if (!apiKey || apiKey === 'placeholder') {
      console.warn('[send-build-access-emails API] Resend API key not configured');
      return res.status(500).json({
        success: false,
        error: 'Resend API key not configured'
      });
    }

    // Get from email
    const fromEmail = process.env.RESEND_FROM_EMAIL || 
                     process.env.REACT_APP_RESEND_FROM_EMAIL ||
                     'noreply@thekingezekielacademy.com';

    // Get APP URL
    const APP_URL = process.env.REACT_APP_SITE_URL || 
                   process.env.REACT_APP_APP_URL || 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_SITE_URL || 
                   'https://app.thekingezekielacademy.com';

    const APP_NAME = 'The King Ezekiel Academy';
    const userName = name || email.split('@')[0];

    let html, subject;

    // Generate email HTML based on type
    if (emailType === 'build_access') {
      // Email 1: BUILD COMMUNITY Access Email
      subject = 'Welcome to B.U.I.L.D COMMUNITY - Your Access Details';
      
      const formattedDate = purchaseDate || new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      html = `
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
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
    
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
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
            <strong>5. CPA MARKETING BLUEPRINT: TKEA RESELLERS</strong> <span style="color: #28a745;">(FREE)</span>
          </li>
          <li style="padding: 8px 0;">
            <strong>6. AI GHOSTWRITING PLAYBOOK: Write Faster. Stay Invisible.</strong>
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
    
    <!-- Step 1: Career Path Discovery Section -->
    <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%); padding: 30px; border-radius: 8px; margin: 30px 0; border: 2px solid #f5576c;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #c53030; margin: 0 0 10px 0; font-size: 22px; font-weight: bold;">🎯 STEP 1: Career Path Discovery</h2>
        <p style="color: #744242; margin: 0; font-size: 16px; font-weight: 500;">Discover Your Ideal Skill Path (Recommended First Step)</p>
      </div>
      
      <div style="background: #ffffff; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <p style="color: #333; margin-bottom: 15px; font-size: 15px; line-height: 1.6;">
          We recommend completing our <strong>Career Path Discovery</strong> (takes just 3 minutes) to:
        </p>
        <ol style="color: #555; padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.8;">
          <li style="margin-bottom: 8px;">Get matched to your ideal skill path based on your natural strengths</li>
          <li style="margin-bottom: 8px;">See which courses align perfectly with your interests and goals</li>
          <li style="margin-bottom: 8px;">Make an informed decision before selecting your free skill course</li>
          <li>Understand which skill path is best suited for your career journey</li>
        </ol>
      </div>
      
      <div style="text-align: center;">
        <a href="${APP_URL}/access/courses" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 87, 108, 0.3);">Start Career Path Discovery →</a>
      </div>
      
      <p style="color: #744242; margin-top: 15px; font-size: 13px; text-align: center; font-style: italic;">
        💡 This is completely FREE and takes only 3 minutes!
      </p>
    </div>
    
    <!-- Step 2: Choose Your Skill Section -->
    <div style="background: linear-gradient(135deg, #fff9e6 0%, #ffe6b3 100%); padding: 30px; border-radius: 8px; margin: 30px 0; border: 3px solid #ffa500;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #b8860b; margin: 0 0 10px 0; font-size: 22px; font-weight: bold;">🎁 STEP 2: Choose Your Skill (FREE COURSE)</h2>
        <p style="color: #8b6914; margin: 0; font-size: 16px; font-weight: 500;">Select ONE Premium Skill Course - Absolutely FREE!</p>
      </div>
      
      <div style="background: #ffffff; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 15px; text-align: center; font-weight: bold;">
          As a B.U.I.L.D COMMUNITY member, you get to choose ONE premium skill course absolutely FREE!
        </p>
        
        <p style="font-size: 14px; color: #555; margin-bottom: 20px; text-align: center;">
          This bonus course will be added to your Library immediately after selection.
        </p>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <p style="font-size: 14px; color: #856404; margin: 0; font-weight: bold; text-align: center;">
            ⚠️ IMPORTANT: You can only choose once. This selection cannot be changed, so choose wisely!
          </p>
        </div>
        
        <p style="font-size: 15px; color: #333; margin-bottom: 12px; font-weight: bold; text-align: center;">Available Skills to Choose From:</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; text-align: center;">
            <strong>• META ANDROMEDA AI</strong>
          </li>
          <li style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; text-align: center;">
            <strong>• VIBE CODING</strong>
          </li>
          <li style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; text-align: center;">
            <strong>• BRANDING</strong>
          </li>
          <li style="padding: 10px 0; color: #333; text-align: center;">
            <strong>• GOOGLE ADS</strong>
          </li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 25px;">
        <a href="${APP_URL}/choose-skill" style="background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 165, 0, 0.3);">🎯 Choose Your Skill Now</a>
      </div>
      
      <p style="font-size: 12px; color: #8b6914; margin-top: 15px; text-align: center; font-style: italic;">
        💡 We recommend completing Career Path Discovery (Step 1) first to make an informed choice!
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
      `.trim();

    } else if (emailType === 'career_discovery') {
      // Email 2: Career Path Discovery Email
      subject = '🎯 Discover Your Career Path - Free Course Selection';
      
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discover Your Career Path</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Discover Your Career Path!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      Congratulations on joining the B.U.I.L.D COMMUNITY! 🎉
    </p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      As a bonus, we're giving you access to our Career Path Discovery tool. This will help you identify which skill path aligns best with your natural strengths and interests.
    </p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f5576c;">
      <h2 style="color: #333; margin-top: 0; font-size: 20px; font-weight: bold; margin-bottom: 15px;">📋 WHAT TO DO:</h2>
      <ol style="color: #666; padding-left: 20px; margin: 0;">
        <li style="margin-bottom: 10px;">Complete the Career Path Discovery (takes 3 minutes)</li>
        <li style="margin-bottom: 10px;">Get matched to your ideal skill path</li>
        <li style="margin-bottom: 10px;">Select a <strong>FREE</strong> course that aligns with your path</li>
        <li style="margin-bottom: 0;">Course will be added to your Library automatically</li>
      </ol>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${careerPathLink || `${APP_URL}/career-path`}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Start Career Path Discovery</a>
    </div>
    
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ffc107;">
      <p style="font-size: 15px; color: #856404; margin: 0 0 10px 0; font-weight: bold;">💡 This is completely FREE!</p>
      <p style="font-size: 14px; color: #856404; margin: 0;">
        The Career Path Discovery will help you choose the best course to start with based on your natural strengths and interests.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      Need help? Contact us at 
      <a href="mailto:support@thekingezekielacademy.com" style="color: #f5576c;">support@thekingezekielacademy.com</a>
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

    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid emailType. Must be "build_access" or "career_discovery"'
      });
    }

    // Send email via Resend API
    console.log('[send-build-access-emails API] Attempting to send email:', { 
      to: email, 
      emailType,
      subject,
      fromEmail 
    });

    let resendResponse;
    try {
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject,
          html,
        }),
      });
    } catch (fetchError) {
      console.error('[send-build-access-emails API] Network error calling Resend:', fetchError);
      return res.status(500).json({
        success: false,
        error: `Network error: ${fetchError.message}`
      });
    }

    // Check response status before parsing
    if (!resendResponse.ok) {
      let errorData;
      try {
        errorData = await resendResponse.json();
      } catch (parseError) {
        const errorText = await resendResponse.text();
        console.error('[send-build-access-emails API] Resend API error (non-JSON):', {
          status: resendResponse.status,
          statusText: resendResponse.statusText,
          body: errorText
        });
        return res.status(resendResponse.status).json({
          success: false,
          error: `Resend API error: ${resendResponse.status} ${resendResponse.statusText}`
        });
      }
      
      console.error('[send-build-access-emails API] Resend API error:', errorData);
      return res.status(resendResponse.status).json({
        success: false,
        error: errorData.message || 'Failed to send email'
      });
    }

    // Parse successful response
    let data;
    try {
      data = await resendResponse.json();
    } catch (parseError) {
      console.error('[send-build-access-emails API] Failed to parse Resend response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Invalid response from Resend API'
      });
    }

    console.log('[send-build-access-emails API] Email sent successfully:', { 
      email, 
      emailType,
      resendId: data.id 
    });
    
    return res.status(200).json({
      success: true,
      message: `${emailType === 'build_access' ? 'BUILD access' : 'Career Path Discovery'} email sent successfully`,
      data
    });

  } catch (error) {
    console.error('[send-build-access-emails API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
