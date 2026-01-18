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
    const { to, message } = req.body;

    // Validate required fields
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      });
    }

    // Get Termii API credentials from environment variables
    const apiKey = process.env.TERMII_API_KEY || process.env.REACT_APP_TERMII_API_KEY;
    const senderId = process.env.TERMII_SENDER_ID || process.env.REACT_APP_TERMII_SENDER_ID || 'KingEzekiel';
    
    if (!apiKey || apiKey === 'placeholder') {
      console.warn('[send-sms API] Termii API key not configured');
      return res.status(500).json({
        success: false,
        error: 'Termii API key not configured'
      });
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = to.replace(/[\s\-\(\)]/g, '');
    
    // Ensure phone number starts with country code (assume Nigeria +234 if not present)
    let phoneNumber = cleanPhone;
    if (!phoneNumber.startsWith('+')) {
      if (phoneNumber.startsWith('234')) {
        phoneNumber = '+' + phoneNumber;
      } else if (phoneNumber.startsWith('0')) {
        phoneNumber = '+234' + phoneNumber.substring(1);
      } else {
        phoneNumber = '+234' + phoneNumber;
      }
    }

    // Send SMS via Termii API
    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        from: senderId,
        sms: message,
        type: 'plain',
        api_key: apiKey,
        channel: 'generic',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-sms API] Termii API error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || data.error || 'Failed to send SMS'
      });
    }

    // Termii returns success in different formats, check for common success indicators
    if (data.code === 'ok' || data.message === 'Successfully sent' || response.status === 200) {
      console.log('[send-sms API] SMS sent successfully:', { to: phoneNumber, data });
      return res.status(200).json({
        success: true,
        data
      });
    } else {
      console.error('[send-sms API] Termii API returned error:', data);
      return res.status(400).json({
        success: false,
        error: data.message || data.error || 'Failed to send SMS'
      });
    }

  } catch (error) {
    console.error('[send-sms API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
