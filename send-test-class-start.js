/**
 * Send a realistic "Class Starting Now" test notification to all Telegram groups
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';
const GROUP_IDS = process.env.TELEGRAM_GROUP_ID 
  ? process.env.TELEGRAM_GROUP_ID.split(',').map(id => id.trim()).filter(id => id)
  : ['-1001846920075', '-1003630393405', '-1003586764205'];

async function sendTestClassStart() {
  console.log('🎉 Sending "Class Starting Now" Test Notification...\n');
  
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  // Example: You'll need to provide actual liveClassId and sessionId
  // For now, using a placeholder that shows the correct format
  const exampleLiveClassId = 'example-live-class-id';
  const exampleSessionId = 'example-session-id';
  const appUrl = process.env.APP_URL || process.env.REACT_APP_URL || 'https://app.thekingezekielacademy.com';
  
  // Create realistic class start message with direct session link
  const telegramMessage = `🎉 **Class Starting Now!**

📚 **5 Ways Nigerians Monetize Their Skills to Earn ₦1M–₦3M Monthly**
📖 Introduction to Freelancing
🌅 **Morning Session**
🕐 ${formattedTime}

👉 [Join Class Now](${appUrl}/live-classes/${exampleLiveClassId}/session/${exampleSessionId})

Don't miss out! Join now to participate in the live session.`;
  
  console.log(`📋 Message Preview:`);
  console.log('─'.repeat(60));
  console.log(telegramMessage.replace(/\*\*/g, '').replace(/👉/g, '👉'));
  console.log('─'.repeat(60));
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  
  // Send to each group/channel
  for (const groupId of GROUP_IDS) {
    try {
      console.log(`📤 Sending to ${groupId}...`);
      
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          text: telegramMessage,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        const chatName = data.result.chat.title || groupId;
        console.log(`   ✅ SUCCESS! Sent to ${chatName}`);
        console.log(`      Message ID: ${data.result.message_id}\n`);
        successCount++;
      } else {
        console.log(`   ❌ FAILED: ${data.description || 'Unknown error'}\n`);
        failCount++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
      failCount++;
    }
  }
  
  console.log('═'.repeat(60));
  console.log(`📊 Results: ${successCount} succeeded, ${failCount} failed out of ${GROUP_IDS.length} groups/channels`);
  console.log('═'.repeat(60));
  
  if (successCount === GROUP_IDS.length) {
    console.log('\n🎉 ALL GROUPS/CHANNELS RECEIVED THE NOTIFICATION!');
    console.log('   ✅ Test notification sent successfully!');
    console.log('   📱 Check your Telegram groups/channels to see the message\n');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some groups received notifications, but not all.');
    console.log('   Check which groups failed and verify bot permissions.\n');
  } else {
    console.log('\n❌ No groups received notifications.');
    console.log('   Check your configuration and bot permissions.\n');
  }
}

sendTestClassStart();
