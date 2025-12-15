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
    const { name, email, courseName, purchasePrice, purchaseDate, accessLink, purchaseId } = req.body;

    // Validate required fields
    if (!email || !courseName || !accessLink) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, courseName, accessLink'
      });
    }

    // Get Resend API key from environment variables
    const apiKey = process.env.RESEND_API_KEY || process.env.REACT_APP_RESEND_API_KEY;
    
    if (!apiKey || apiKey === 'placeholder') {
      console.warn('[send-purchase-access-email API] Resend API key not configured');
      return res.status(500).json({
        success: false,
        error: 'Resend API key not configured'
      });
    }

    // Get from email
    const fromEmail = process.env.RESEND_FROM_EMAIL || 
                     process.env.REACT_APP_RESEND_FROM_EMAIL ||
                     'noreply@thekingezekielacademy.com';

    // Generate purchase access email HTML template
    const APP_NAME = 'The King Ezekiel Academy';
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.thekingezekielacademy.com';
    
    const priceInNaira = purchasePrice ? (purchasePrice / 100).toLocaleString() : '0';
    const formattedDate = purchaseDate || new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const userName = name || 'Valued Student';

    const html = `
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
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
      Thank you for your purchase! Your course is ready for you.
    </p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
      <h2 style="color: #333; margin-top: 0; font-size: 22px; font-weight: bold;">${courseName}</h2>
      <p style="color: #666; margin-bottom: 10px;"><strong>Price:</strong> ₦${priceInNaira}</p>
      <p style="color: #666; margin-bottom: 0;"><strong>Purchase Date:</strong> ${formattedDate}</p>
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
    `.trim();

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `Your Course Access - ${courseName}`,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-purchase-access-email API] Resend API error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Failed to send email'
      });
    }

    console.log('[send-purchase-access-email API] Purchase access email sent successfully:', { email, courseName, purchaseId, data });
    return res.status(200).json({
      success: true,
      message: 'Purchase access email sent successfully',
      data
    });

  } catch (error) {
    console.error('[send-purchase-access-email API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

