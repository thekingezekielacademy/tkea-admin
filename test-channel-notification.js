/**
 * Test sending to Telegram Channel when class starts
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';

async function testChannelNotification() {
  console.log('🧪 Testing Telegram Channel Notification...\n');
  
  // Channel ID we found earlier
  const channelId = '-1003630393405'; // LIVE CLASSES REMINDER channel
  
  console.log('📋 Configuration:');
  console.log(`   Channel ID: ${channelId}`);
  console.log(`   Channel Name: LIVE CLASSES REMINDER - THEKINGEZEKIEL.COM\n`);
  
  // Create test message (simulating class start)
  const testMessage = `🧪 **TEST: Class Starting Now!**

📚 **Test Course**
📖 Test Lesson
🌅 **Morning Session**
🕐 ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}

👉 [Join Class Now](https://app.thekingezekielacademy.com/live-classes)

This is a TEST to verify channel notifications work! ✅`;
  
  console.log('📤 Sending test message to Telegram Channel...\n');
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        text: testMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      console.log('✅ SUCCESS! Test message sent to Telegram Channel!');
      console.log(`   Message ID: ${data.result.message_id}`);
      console.log(`   Channel: ${data.result.chat.title}`);
      console.log(`   Sent at: ${new Date(data.result.date * 1000).toLocaleString()}\n`);
      console.log('🎉 Your Telegram Channel notification is working correctly!');
      console.log('   ✅ Bots CAN send messages to channels (if bot is admin)');
      console.log('   ✅ Channels work the same as groups for notifications\n');
    } else {
      console.error('❌ FAILED to send message!');
      console.error('   Error:', data.description || 'Unknown error');
      console.error('   Error Code:', data.error_code);
      
      if (data.error_code === 400) {
        console.log('\n💡 Common issues:');
        console.log('   - Bot might not be admin of the channel');
        console.log('   - Bot might not have permission to post messages');
        console.log('   - Channel ID might be incorrect');
        console.log('\n📝 To fix:');
        console.log('   1. Add bot to channel as admin');
        console.log('   2. Give bot permission to "Post Messages"');
        console.log('   3. Verify channel ID is correct');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChannelNotification();
