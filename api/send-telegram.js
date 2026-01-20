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
    const { title, description, buttonText, buttonLink } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description'
      });
    }

    // Get Telegram bot token from environment variables
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN || process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
    
    if (!telegramToken || telegramToken === 'placeholder') {
      console.warn('[send-telegram API] Telegram bot token not configured');
      return res.status(500).json({
        success: false,
        error: 'Telegram bot token not configured'
      });
    }

    // Get Telegram group/channel IDs
    const telegramGroupIdsRaw = process.env.TELEGRAM_GROUP_ID || process.env.REACT_APP_TELEGRAM_GROUP_ID;
    const telegramGroupIds = telegramGroupIdsRaw 
      ? telegramGroupIdsRaw.split(',').map(id => id.trim()).filter(id => id)
      : [];

    if (telegramGroupIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No Telegram group/channel IDs configured. Please set TELEGRAM_GROUP_ID environment variable.'
      });
    }

    // Build message text
    let messageText = `*${title}*\n\n${description}`;

    // Build inline keyboard if button is provided
    let replyMarkup = null;
    if (buttonText && buttonLink) {
      replyMarkup = {
        inline_keyboard: [[
          {
            text: buttonText,
            url: buttonLink
          }
        ]]
      };
    }

    // Send to all configured Telegram groups/channels
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const chatId of telegramGroupIds) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
            reply_markup: replyMarkup
          }),
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          successCount++;
          results.push({
            chatId,
            success: true,
            messageId: data.result?.message_id
          });
          console.log(`[send-telegram API] Message sent successfully to ${chatId}`);
        } else {
          failCount++;
          results.push({
            chatId,
            success: false,
            error: data.description || 'Unknown error'
          });
          console.error(`[send-telegram API] Failed to send to ${chatId}:`, data.description);
        }
      } catch (error) {
        failCount++;
        results.push({
          chatId,
          success: false,
          error: error.message || 'Unknown error'
        });
        console.error(`[send-telegram API] Error sending to ${chatId}:`, error);
      }
    }

    if (successCount === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send to all Telegram groups/channels',
        results
      });
    }

    return res.status(200).json({
      success: true,
      sent: successCount,
      failed: failCount,
      total: telegramGroupIds.length,
      results
    });

  } catch (error) {
    console.error('[send-telegram API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
