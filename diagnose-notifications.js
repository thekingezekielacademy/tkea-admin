#!/usr/bin/env node
/**
 * Comprehensive Telegram Notification Diagnostic Tool
 * Run this to identify why notifications stopped sending
 */

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

async function diagnose() {
  console.log('🔍 TELEGRAM NOTIFICATION DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log(`Time: ${new Date().toISOString()}\n`);

  const issues = [];
  const warnings = [];

  // ============================================
  // 1. CHECK ENVIRONMENT VARIABLES
  // ============================================
  console.log('1️⃣  ENVIRONMENT VARIABLES CHECK:\n');

  const envVars = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_GROUP_ID: process.env.TELEGRAM_GROUP_ID,
    TELEGRAM_GROUP_IDS: process.env.TELEGRAM_GROUP_IDS,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  Object.entries(envVars).forEach(([name, value]) => {
    if (value) {
      const display = name.includes('KEY') || name.includes('TOKEN') 
        ? `${value.substring(0, 15)}...` 
        : value;
      console.log(`   ✅ ${name}: Set (${display})`);
    } else {
      console.log(`   ❌ ${name}: NOT SET`);
      if (['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_ID', 'QSTASH_TOKEN'].includes(name)) {
        issues.push(`Missing critical env var: ${name}`);
      }
    }
  });

  const telegramGroupIds = process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_GROUP_IDS;
  if (telegramGroupIds) {
    const groups = telegramGroupIds.split(',').map(g => g.trim());
    console.log(`\n   📱 Telegram Groups (${groups.length}):`);
    groups.forEach((g, i) => console.log(`      ${i + 1}. ${g}`));
  }

  // ============================================
  // 2. CHECK QSTASH SCHEDULE
  // ============================================
  console.log('\n2️⃣  QSTASH SCHEDULE CHECK:\n');

  const qstashToken = process.env.QSTASH_TOKEN;
  if (qstashToken) {
    try {
      const { Client } = require('@upstash/qstash');
      const client = new Client({ token: qstashToken });
      const schedules = await client.schedules.list();

      console.log(`   Total schedules: ${schedules.length}`);

      const batchSchedules = schedules.filter(s => 
        s.destination && (
          s.destination.includes('batch-notifications') ||
          s.destination.includes('qstash-batch') ||
          s.destination.includes('qstash-reminders')
        )
      );

      if (batchSchedules.length === 0) {
        console.log('\n   ❌ NO NOTIFICATION SCHEDULES FOUND!');
        issues.push('No QStash schedules found for batch notifications');
        console.log('   This is likely why notifications stopped.');
        console.log('   Run: node update-qstash-batch-schedule.js to create one');
      } else {
        console.log(`\n   📋 Notification-related schedules (${batchSchedules.length}):\n`);
        batchSchedules.forEach(s => {
          const statusIcon = s.paused ? '⏸️  PAUSED' : '▶️  Active';
          console.log(`   ${statusIcon}`);
          console.log(`      ID: ${s.scheduleId}`);
          console.log(`      URL: ${s.destination}`);
          console.log(`      Cron: ${s.cron || 'N/A'}`);
          
          if (s.paused) {
            issues.push(`QStash schedule ${s.scheduleId} is PAUSED`);
            console.log(`      ⚠️  THIS SCHEDULE IS PAUSED - NOTIFICATIONS WON'T SEND`);
          }
          console.log('');
        });
      }

      // Show all schedules for reference
      console.log('   All schedules:');
      schedules.forEach(s => {
        console.log(`      - ${s.scheduleId}: ${s.destination?.substring(0, 60)}... (${s.paused ? 'PAUSED' : 'active'})`);
      });

    } catch (error) {
      console.log(`   ⚠️  Error checking QStash: ${error.message}`);
      warnings.push(`Could not check QStash: ${error.message}`);
    }
  } else {
    console.log('   ❌ Cannot check QStash - QSTASH_TOKEN not set');
    issues.push('QSTASH_TOKEN not set locally - cannot verify schedule status');
  }

  // ============================================
  // 3. CHECK DATABASE - NOTIFICATION HISTORY
  // ============================================
  console.log('\n3️⃣  DATABASE CHECK - NOTIFICATION HISTORY:\n');

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const now = new Date();

      // Get last 7 days of notifications
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: recentNotifications, error: notifError } = await supabase
        .from('batch_class_notifications')
        .select('*')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (notifError) {
        console.log(`   ❌ Error querying notifications: ${notifError.message}`);
      } else {
        console.log(`   📊 Notifications in last 7 days: ${recentNotifications?.length || 0}`);

        if (!recentNotifications || recentNotifications.length === 0) {
          console.log('\n   ⚠️  NO NOTIFICATIONS FOUND IN DATABASE FOR LAST 7 DAYS');
          issues.push('No notification records in database for last 7 days');
        } else {
          console.log('\n   Recent notifications:');
          recentNotifications.slice(0, 10).forEach(n => {
            const date = new Date(n.created_at || n.sent_at);
            console.log(`      - ${date.toISOString()}: ${n.notification_type} - ${n.status}`);
            if (n.error_message) {
              console.log(`        Error: ${n.error_message}`);
            }
          });

          // Check for failed notifications
          const failed = recentNotifications.filter(n => n.status === 'failed');
          if (failed.length > 0) {
            console.log(`\n   ⚠️  Failed notifications: ${failed.length}`);
            warnings.push(`${failed.length} failed notifications in last 7 days`);
          }

          // Find the last successful notification
          const lastSuccess = recentNotifications.find(n => n.status === 'sent');
          if (lastSuccess) {
            const lastDate = new Date(lastSuccess.sent_at);
            const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            console.log(`\n   📅 Last successful notification: ${lastDate.toISOString()} (${daysSince} days ago)`);
            
            if (daysSince > 1) {
              warnings.push(`Last successful notification was ${daysSince} days ago`);
            }
          }
        }
      }

      // Check upcoming sessions
      console.log('\n   📅 Upcoming sessions (next 24h):');
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: upcomingSessions, error: sessError } = await supabase
        .from('batch_class_sessions')
        .select('id, class_name, scheduled_datetime, scheduled_time, session_type, status')
        .eq('status', 'scheduled')
        .gte('scheduled_datetime', now.toISOString())
        .lte('scheduled_datetime', tomorrow.toISOString())
        .order('scheduled_datetime', { ascending: true });

      if (sessError) {
        console.log(`   ❌ Error: ${sessError.message}`);
      } else if (!upcomingSessions || upcomingSessions.length === 0) {
        console.log('      No sessions scheduled in next 24 hours');
        warnings.push('No upcoming sessions found - might be expected');
      } else {
        console.log(`      Found ${upcomingSessions.length} session(s):`);
        upcomingSessions.forEach(s => {
          const sessionTime = new Date(s.scheduled_datetime);
          const minsUntil = Math.floor((sessionTime - now) / (1000 * 60));
          const hoursUntil = Math.floor(minsUntil / 60);
          console.log(`      - ${s.scheduled_time}: ${s.class_name} (${s.session_type}) - in ${hoursUntil}h ${minsUntil % 60}m`);
        });
      }

    } catch (error) {
      console.log(`   ❌ Database error: ${error.message}`);
      issues.push(`Database connection error: ${error.message}`);
    }
  } else {
    console.log('   ❌ Cannot check database - Supabase credentials not set');
    issues.push('Supabase credentials not available');
  }

  // ============================================
  // 4. TEST TELEGRAM BOT
  // ============================================
  console.log('\n4️⃣  TELEGRAM BOT TEST:\n');

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (telegramToken && telegramGroupIds) {
    const groups = telegramGroupIds.split(',').map(g => g.trim());
    
    // Just get bot info, don't send a message
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        console.log(`   ✅ Bot is valid: @${data.result.username}`);
        console.log(`   Bot ID: ${data.result.id}`);
      } else {
        console.log(`   ❌ Bot token invalid: ${data.description}`);
        issues.push(`Invalid Telegram bot token: ${data.description}`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing bot: ${error.message}`);
      issues.push(`Cannot reach Telegram API: ${error.message}`);
    }

    // Check if bot can access groups (get chat info)
    console.log('\n   Checking group access:');
    for (const groupId of groups) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/getChat?chat_id=${groupId}`);
        const data = await response.json();
        
        if (data.ok) {
          console.log(`   ✅ Group ${groupId}: ${data.result.title || data.result.type}`);
        } else {
          console.log(`   ❌ Group ${groupId}: ${data.description}`);
          issues.push(`Cannot access Telegram group ${groupId}: ${data.description}`);
        }
      } catch (error) {
        console.log(`   ❌ Group ${groupId}: ${error.message}`);
      }
    }
  } else {
    console.log('   ⚠️  Cannot test - missing token or group IDs');
  }

  // ============================================
  // 5. SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNOSTIC SUMMARY\n');

  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Configuration looks correct.\n');
    console.log('If notifications still not working, check:');
    console.log('  1. Vercel function logs for runtime errors');
    console.log('  2. QStash dashboard for execution history');
    console.log('  3. Make sure TELEGRAM_GROUP_ID is set in Vercel Dashboard (not just locally)\n');
  } else {
    if (issues.length > 0) {
      console.log('❌ CRITICAL ISSUES FOUND:\n');
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n');
      warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`));
      console.log('');
    }
  }

  // Recommendations
  console.log('📝 RECOMMENDED ACTIONS:\n');
  
  if (issues.some(i => i.includes('QStash') && i.includes('PAUSED'))) {
    console.log('   1. RESUME the paused QStash schedule:');
    console.log('      - Go to https://console.upstash.com/qstash');
    console.log('      - Find the paused schedule');
    console.log('      - Click "Resume" or "Unpause"\n');
  }
  
  if (issues.some(i => i.includes('No QStash schedules'))) {
    console.log('   1. CREATE a new QStash schedule:');
    console.log('      Run: node update-qstash-batch-schedule.js\n');
  }
  
  if (issues.some(i => i.includes('TELEGRAM_GROUP_ID') || i.includes('TELEGRAM_BOT_TOKEN'))) {
    console.log('   2. Set Telegram environment variables in Vercel:');
    console.log('      - Go to Vercel Dashboard → Settings → Environment Variables');
    console.log('      - Add TELEGRAM_BOT_TOKEN and TELEGRAM_GROUP_ID');
    console.log('      - Make sure they are set for Production environment');
    console.log('      - REDEPLOY the application after adding\n');
  }

  console.log('   3. After fixes, verify by checking Vercel function logs:');
  console.log('      - Go to Vercel Dashboard → Functions');
  console.log('      - Check /api/cron/qstash-batch-notifications');
  console.log('      - Look for recent invocations and any errors\n');

  console.log('='.repeat(80));
}

diagnose().catch(console.error);
