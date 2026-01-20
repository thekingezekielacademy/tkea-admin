/**
 * Simple script to get your Telegram Group ID
 * 
 * Instructions:
 * 1. Make sure your bot is added to the Telegram group as admin
 * 2. Send ANY message in the group (can be from anyone)
 * 3. Run this script: node get-telegram-group-id.js
 * 4. Look for the group ID in the output (it will be a negative number)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';

async function getGroupId() {
  try {
    console.log('🔍 Fetching updates from Telegram...\n');
    console.log('📝 Make sure someone has sent a message in your group recently!\n');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('❌ Error:', data.description);
      return;
    }
    
    if (!data.result || data.result.length === 0) {
      console.log('⚠️  No updates found. Please send a message in your Telegram group first!');
      console.log('   Then run this script again.\n');
      return;
    }
    
    console.log('✅ Found updates! Looking for group chats...\n');
    
    const groups = new Map();
    
    // Find all groups
    for (const update of data.result) {
      if (update.message && update.message.chat) {
        const chat = update.message.chat;
        
        // Groups have negative IDs and type 'group' or 'supergroup'
        if (chat.id < 0 && (chat.type === 'group' || chat.type === 'supergroup')) {
          const groupId = chat.id.toString();
          if (!groups.has(groupId)) {
            groups.set(groupId, {
              id: chat.id,
              title: chat.title || 'Unknown Group',
              type: chat.type,
              username: chat.username || 'No username'
            });
          }
        }
      }
    }
    
    if (groups.size === 0) {
      console.log('⚠️  No groups found in recent updates.');
      console.log('   Make sure:');
      console.log('   1. Your bot is added to the group');
      console.log('   2. Someone has sent a message in the group');
      console.log('   3. The bot has permission to read messages\n');
      return;
    }
    
    console.log('📋 Found Telegram Groups:\n');
    console.log('═'.repeat(60));
    
    for (const [id, group] of groups) {
      console.log(`\n🏷️  Group Name: ${group.title}`);
      console.log(`   Type: ${group.type}`);
      console.log(`   Username: ${group.username || 'N/A'}`);
      console.log(`   🔑 GROUP ID: ${group.id}`);
      console.log(`   📝 Use this in your .env file:`);
      console.log(`      TELEGRAM_GROUP_ID=${group.id}`);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ Copy the GROUP ID above and add it to your environment variables!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. TELEGRAM_BOT_TOKEN is set correctly');
    console.log('2. Your bot is added to the group');
    console.log('3. Someone has sent a message in the group recently');
  }
}

getGroupId();
