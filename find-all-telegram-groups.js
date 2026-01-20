/**
 * Find ALL Telegram Groups and Channels the bot has access to
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';

async function findAllGroups() {
  try {
    console.log('🔍 Finding ALL Telegram Groups and Channels...\n');
    console.log('📝 Make sure someone has sent messages in your groups/channels recently!\n');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-100`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('❌ Error:', data.description);
      return;
    }
    
    if (!data.result || data.result.length === 0) {
      console.log('⚠️  No updates found. Please send messages in your groups/channels first!');
      console.log('   Then run this script again.\n');
      return;
    }
    
    console.log('✅ Found updates! Analyzing chats...\n');
    
    const chats = new Map();
    
    // Find all chats (groups, supergroups, channels)
    for (const update of data.result) {
      if (update.message && update.message.chat) {
        const chat = update.message.chat;
        const chatId = chat.id.toString();
        
        if (!chats.has(chatId)) {
          chats.set(chatId, {
            id: chat.id,
            title: chat.title || chat.first_name || 'Unknown',
            type: chat.type,
            username: chat.username || 'No username',
            isGroup: chat.type === 'group' || chat.type === 'supergroup',
            isChannel: chat.type === 'channel'
          });
        }
      }
      
      // Also check channel posts
      if (update.channel_post && update.channel_post.chat) {
        const chat = update.channel_post.chat;
        const chatId = chat.id.toString();
        
        if (!chats.has(chatId)) {
          chats.set(chatId, {
            id: chat.id,
            title: chat.title || 'Unknown Channel',
            type: chat.type,
            username: chat.username || 'No username',
            isGroup: false,
            isChannel: true
          });
        }
      }
    }
    
    if (chats.size === 0) {
      console.log('⚠️  No chats found.');
      return;
    }
    
    // Separate groups and channels
    const groups = [];
    const channels = [];
    
    for (const [id, chat] of chats) {
      if (chat.isGroup) {
        groups.push(chat);
      } else if (chat.isChannel) {
        channels.push(chat);
      }
    }
    
    console.log('═'.repeat(70));
    console.log('📋 TELEGRAM GROUPS (for class start notifications)');
    console.log('═'.repeat(70));
    
    if (groups.length === 0) {
      console.log('\n⚠️  No groups found.');
    } else {
      for (const group of groups) {
        console.log(`\n🏷️  Group Name: ${group.title}`);
        console.log(`   Type: ${group.type}`);
        console.log(`   Username: ${group.username || 'N/A'}`);
        console.log(`   🔑 GROUP ID: ${group.id}`);
        console.log(`   📝 Use in TELEGRAM_GROUP_ID: ${group.id}`);
      }
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('📢 TELEGRAM CHANNELS (for countdown reminders)');
    console.log('═'.repeat(70));
    
    if (channels.length === 0) {
      console.log('\n⚠️  No channels found.');
    } else {
      for (const channel of channels) {
        console.log(`\n📢 Channel Name: ${channel.title}`);
        console.log(`   Type: ${channel.type}`);
        console.log(`   Username: ${channel.username || 'N/A'}`);
        console.log(`   🔑 CHANNEL ID: ${channel.id}`);
        console.log(`   📝 Use in TELEGRAM_CHANNEL_ID: ${channel.id}`);
      }
    }
    
    console.log('\n' + '═'.repeat(70));
    
    if (groups.length > 0) {
      console.log('\n📝 To send to MULTIPLE groups, use comma-separated IDs:');
      console.log(`   TELEGRAM_GROUP_ID=${groups.map(g => g.id).join(',')}`);
    }
    
    console.log('\n✅ Copy the GROUP IDs above and add them to your environment variables!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. TELEGRAM_BOT_TOKEN is set correctly');
    console.log('2. Your bot is added to the groups/channels');
    console.log('3. Someone has sent messages in the groups/channels recently');
  }
}

findAllGroups();
