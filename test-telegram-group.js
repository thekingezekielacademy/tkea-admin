/**
 * Test script to verify Telegram Group notifications work
 * 
 * This simulates what happens when a live class starts
 */

const { createClient } = require('@supabase/supabase-js');

async function testTelegramGroupNotification() {
  console.log('🧪 Testing Telegram Group Notification...\n');
  
  // Check environment variables
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';
  const telegramGroupId = process.env.TELEGRAM_GROUP_ID;
  const telegramChannelId = process.env.TELEGRAM_CHANNEL_ID || '@LIVECLASSREMINDER';
  
  console.log('📋 Configuration Check:');
  console.log(`   Bot Token: ${telegramToken.substring(0, 20)}... ✅`);
  console.log(`   Channel ID: ${telegramChannelId} ✅`);
  
  if (!telegramGroupId) {
    console.log(`   Group ID: ❌ NOT SET!`);
    console.log('\n⚠️  TELEGRAM_GROUP_ID is not set!');
    console.log('   Set it to: -1001846920075');
    console.log('   Or run: export TELEGRAM_GROUP_ID=-1001846920075\n');
    return;
  } else {
    console.log(`   Group ID: ${telegramGroupId} ✅`);
  }
  
  console.log('\n📤 Sending test message to Telegram Group...\n');
  
  // Create a test message (simulating class start)
  const testMessage = `🧪 **TEST: Class Starting Now!**

📚 **Test Course**
📖 Test Lesson
🌅 **Morning Session**
🕐 ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}

👉 [Join Class Now](https://app.thekingezekielacademy.com/live-classes)

This is a TEST message to verify group notifications are working! ✅`;

  try {
    // Send test message to group
    const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramGroupId,
        text: testMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      console.log('✅ SUCCESS! Test message sent to Telegram Group!');
      console.log(`   Message ID: ${data.result.message_id}`);
      console.log(`   Chat: ${data.result.chat.title || 'Group'}`);
      console.log(`   Sent at: ${new Date(data.result.date * 1000).toLocaleString()}\n`);
      console.log('🎉 Your Telegram Group notification is working correctly!');
      console.log('   Check your Telegram group: "The King Ezekiel Academy Group"\n');
    } else {
      console.error('❌ FAILED to send message!');
      console.error('   Error:', data.description || 'Unknown error');
      console.error('   Full response:', JSON.stringify(data, null, 2));
      
      if (data.error_code === 400) {
        console.log('\n💡 Common issues:');
        console.log('   - Bot might not be admin of the group');
        console.log('   - Group ID might be incorrect');
        console.log('   - Bot might not have permission to send messages');
      }
    }
  } catch (error) {
    console.error('❌ Error sending test message:', error.message);
    console.error('\nFull error:', error);
  }
}

// Run the test
testTelegramGroupNotification();
