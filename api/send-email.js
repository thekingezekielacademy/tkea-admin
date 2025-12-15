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
    const { to, subject, html, from } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    // Get Resend API key from environment variables
    const apiKey = process.env.RESEND_API_KEY || process.env.REACT_APP_RESEND_API_KEY;
    
    if (!apiKey || apiKey === 'placeholder') {
      console.warn('[send-email API] Resend API key not configured');
      return res.status(500).json({
        success: false,
        error: 'Resend API key not configured'
      });
    }

    // Get from email
    const fromEmail = from || 
                     process.env.RESEND_FROM_EMAIL || 
                     process.env.REACT_APP_RESEND_FROM_EMAIL ||
                     'noreply@thekingezekielacademy.com';

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-email API] Resend API error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Failed to send email'
      });
    }

    console.log('[send-email API] Email sent successfully:', { to, subject, data });
    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[send-email API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

