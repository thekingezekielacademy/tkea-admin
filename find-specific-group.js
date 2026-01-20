/**
 * Find a specific Telegram group by searching for its name
 * Run this after sending a message in the group you're looking for
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8447617613:AAH0QHB57N9APWnX-MAHH_JsJqzfB8p4vJo';
const SEARCH_TERM = process.argv[2] || 'LIVE CLASSES REMINDER';

async function findSpecificGroup() {
  try {
    console.log(`🔍 Searching for group containing: "${SEARCH_TERM}"\n`);
    console.log('📝 Make sure someone has sent a message in the group recently!\n');
    
    // Get more updates to search through
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-200`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('❌ Error:', data.description);
      return;
    }
    
    if (!data.result || data.result.length === 0) {
      console.log('⚠️  No updates found.');
      console.log('   Please send a message in the group you\'re looking for, then run this script again.\n');
      return;
    }
    
    console.log(`✅ Found ${data.result.length} updates. Searching...\n`);
    
    const matches = [];
    
    // Search through all updates
    for (const update of data.result) {
      let chat = null;
      
      if (update.message && update.message.chat) {
        chat = update.message.chat;
      } else if (update.channel_post && update.channel_post.chat) {
        chat = update.channel_post.chat;
      }
      
      if (chat && chat.title) {
        const title = chat.title.toLowerCase();
        const searchTermLower = SEARCH_TERM.toLowerCase();
        
        // Check if title contains search term
        if (title.includes(searchTermLower)) {
          const chatId = chat.id.toString();
          
          // Avoid duplicates
          if (!matches.find(m => m.id === chat.id)) {
            matches.push({
              id: chat.id,
              title: chat.title,
              type: chat.type,
              username: chat.username || 'No username',
              isGroup: chat.type === 'group' || chat.type === 'supergroup',
              isChannel: chat.type === 'channel'
            });
          }
        }
      }
    }
    
    if (matches.length === 0) {
      console.log(`⚠️  No groups/channels found matching "${SEARCH_TERM}"`);
      console.log('\n💡 Tips:');
      console.log('   1. Make sure someone has sent a message in the group recently');
      console.log('   2. Try searching with a shorter term (e.g., "LIVE CLASSES")');
      console.log('   3. Run: node find-all-telegram-groups.js to see all groups\n');
      return;
    }
    
    console.log(`✅ Found ${matches.length} match(es):\n`);
    console.log('═'.repeat(70));
    
    for (const match of matches) {
      const chatType = match.isGroup ? 'GROUP' : match.isChannel ? 'CHANNEL' : 'CHAT';
      console.log(`\n${chatType}: ${match.title}`);
      console.log(`   Type: ${match.type}`);
      console.log(`   Username: ${match.username || 'N/A'}`);
      console.log(`   🔑 ID: ${match.id}`);
      
      if (match.isGroup) {
        console.log(`   📝 Add to TELEGRAM_GROUP_ID: ${match.id}`);
      } else if (match.isChannel) {
        console.log(`   📝 Add to TELEGRAM_CHANNEL_ID: ${match.id}`);
      }
    }
    
    console.log('\n' + '═'.repeat(70));
    
    const groups = matches.filter(m => m.isGroup);
    if (groups.length > 0) {
      console.log('\n📝 To add to multiple groups, use comma-separated IDs:');
      console.log(`   TELEGRAM_GROUP_ID=-1001846920075,${groups.map(g => g.id).join(',')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findSpecificGroup();
