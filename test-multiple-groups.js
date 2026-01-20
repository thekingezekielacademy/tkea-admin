/**
 * Test sending to MULTIPLE Telegram groups when class starts
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';

async function testMultipleGroups() {
  console.log('🧪 Testing Multiple Group Notifications...\n');
  
  // Test with multiple group IDs (comma-separated)
  // Group 1: The King Ezekiel Academy Group
  // Group 2: We'll add the second one once we find it
  const groupIds = process.env.TELEGRAM_GROUP_ID 
    ? process.env.TELEGRAM_GROUP_ID.split(',').map(id => id.trim()).filter(id => id)
    : ['-1001846920075']; // Default to the one we know
  
  console.log(`📋 Testing with ${groupIds.length} group(s):`);
  groupIds.forEach((id, index) => {
    console.log(`   ${index + 1}. ${id}`);
  });
  console.log('');
  
  // Create test message
  const testMessage = `🧪 **TEST: Class Starting Now!**

📚 **Test Course - Multiple Groups**
📖 Testing Multiple Group Notifications
🌅 **Morning Session**
🕐 ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}

👉 [Join Class Now](https://app.thekingezekielacademy.com/live-classes)

This is a TEST to verify notifications work for MULTIPLE groups! ✅`;
  
  let successCount = 0;
  let failCount = 0;
  
  // Send to each group
  for (const groupId of groupIds) {
    try {
      console.log(`📤 Sending to group ${groupId}...`);
      
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          text: testMessage,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        console.log(`   ✅ SUCCESS! Sent to ${data.result.chat.title || groupId}`);
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
  console.log(`📊 Results: ${successCount} succeeded, ${failCount} failed out of ${groupIds.length} groups`);
  console.log('═'.repeat(60));
  
  if (successCount === groupIds.length) {
    console.log('\n🎉 ALL GROUPS RECEIVED THE NOTIFICATION!');
    console.log('   ✅ Multiple group notifications are working correctly!\n');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some groups received notifications, but not all.');
    console.log('   Check which groups failed and verify:');
    console.log('   - Bot is admin of all groups');
    console.log('   - Bot has permission to send messages');
    console.log('   - Group IDs are correct\n');
  } else {
    console.log('\n❌ No groups received notifications.');
    console.log('   Check your configuration and bot permissions.\n');
  }
}

testMultipleGroups();
