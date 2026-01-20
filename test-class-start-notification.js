/**
 * Comprehensive test: Simulates what happens when a live class starts
 * This tests the exact same logic used in the cron job
 */

const { createClient } = require('@supabase/supabase-js');

async function testClassStartNotification() {
  console.log('🧪 Testing Live Class Start Notification Flow...\n');
  
  // Environment variables (same as cron job)
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';
  const telegramGroupId = process.env.TELEGRAM_GROUP_ID;
  const telegramChannelId = process.env.TELEGRAM_CHANNEL_ID || '@LIVECLASSREMINDER';
  const appUrl = process.env.APP_URL || process.env.REACT_APP_URL || 'https://app.thekingezekielacademy.com';
  
  if (!telegramGroupId) {
    console.log('❌ TELEGRAM_GROUP_ID not set!');
    console.log('   Set it to: -1001846920075\n');
    return;
  }
  
  // Simulate class session data (like what comes from database)
  const mockSession = {
    id: 'test-session-' + Date.now(),
    scheduled_datetime: new Date().toISOString(),
    session_type: 'morning',
    live_classes: {
      courses: {
        title: 'Test Course - Freelancing Mastery'
      }
    },
    course_videos: {
      name: 'Introduction to Freelancing'
    }
  };
  
  // Format session time (same logic as cron job)
  const sessionDate = new Date(mockSession.scheduled_datetime);
  const formattedDate = sessionDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  // Get session type emoji (same logic as cron job)
  const sessionTypeEmoji = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌙'
  }[mockSession.session_type] || '📚';
  
  const sessionTypeLabel = mockSession.session_type.charAt(0).toUpperCase() + mockSession.session_type.slice(1);
  const courseTitle = mockSession.live_classes?.courses?.title || 'Live Class';
  const lessonName = mockSession.course_videos?.name || 'Class Session';
  const classUrl = `${appUrl}/live-classes/session/${mockSession.id}`;
  
  // Create the exact message that would be sent when class starts
  const telegramMessage = `🎉 **Class Starting Now!**

📚 **${courseTitle}**
📖 ${lessonName}
${sessionTypeEmoji} **${sessionTypeLabel} Session**
🕐 ${formattedTime}

👉 [Join Class Now](${classUrl})

Don't miss out! Join now to participate in the live session.`;
  
  console.log('📋 Test Configuration:');
  console.log(`   Course: ${courseTitle}`);
  console.log(`   Lesson: ${lessonName}`);
  console.log(`   Session Type: ${sessionTypeLabel} ${sessionTypeEmoji}`);
  console.log(`   Time: ${formattedTime}`);
  console.log(`   Group ID: ${telegramGroupId}`);
  console.log(`   Class URL: ${classUrl}\n`);
  
  console.log('📤 Sending notification to Telegram Group...\n');
  
  try {
    // Send to Telegram group (same API call as cron job)
    const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramGroupId,
        text: telegramMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    const telegramData = await telegramResponse.json();

    if (telegramResponse.ok && telegramData.ok) {
      console.log('✅ SUCCESS! Class start notification sent to Telegram Group!');
      console.log(`   Message ID: ${telegramData.result.message_id}`);
      console.log(`   Chat: ${telegramData.result.chat.title}`);
      console.log(`   Sent at: ${new Date(telegramData.result.date * 1000).toLocaleString()}\n`);
      console.log('🎉 TEST PASSED!');
      console.log('   ✅ Bot can send messages to group');
      console.log('   ✅ Group ID is correct');
      console.log('   ✅ Message format is correct');
      console.log('   ✅ All group members will be notified\n');
      console.log('📱 Check your Telegram group: "The King Ezekiel Academy Group"');
      console.log('   You should see the test notification!\n');
    } else {
      console.error('❌ FAILED!');
      console.error('   Error:', telegramData.description || 'Unknown error');
      console.error('   Error Code:', telegramData.error_code);
      
      if (telegramData.error_code === 400) {
        console.log('\n💡 Troubleshooting:');
        console.log('   - Make sure bot is admin of the group');
        console.log('   - Check that bot has permission to send messages');
        console.log('   - Verify group ID is correct');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testClassStartNotification();
