/**
 * Check QStash message status
 * This will help us see what's happening with the stuck message
 */

const { Client } = require('@upstash/qstash');
require('dotenv').config();

async function checkMessage() {
  const qstashToken = process.env.QSTASH_TOKEN;
  const qstashUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  
  if (!qstashToken) {
    console.error('❌ QSTASH_TOKEN not set!');
    return;
  }

  const client = new Client({ 
    token: qstashToken,
    baseUrl: qstashUrl
  });

  try {
    // Get the message ID from the schedule state
    const messageId = 'msg_26hZCxZCuWyyTWPmSVBrNCtiJGNMQaLyVLGYo49bcDBYbnHHKnTihWJHyDPA5Gv';
    
    console.log('🔍 Checking QStash message status...\n');
    console.log(`Message ID: ${messageId}\n`);
    
    // Try to get message details
    try {
      const message = await client.messages.get(messageId);
      console.log('📊 Message Details:');
      console.log(JSON.stringify(message, null, 2));
    } catch (error) {
      console.error('❌ Error fetching message:', error.message);
      console.log('\n💡 Trying to list recent messages...\n');
      
      // List recent messages
      const messages = await client.messages.list({ limit: 10 });
      console.log(`Found ${messages.length} recent messages:\n`);
      messages.forEach((msg, i) => {
        console.log(`${i + 1}. Message ID: ${msg.messageId}`);
        console.log(`   Status: ${msg.status}`);
        console.log(`   Destination: ${msg.destination}`);
        console.log(`   Created: ${new Date(msg.createdAt).toLocaleString()}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

checkMessage();
