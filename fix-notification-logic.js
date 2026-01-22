/**
 * Fix the notification logic to be simpler and more reliable
 */

const fs = require('fs');

let content = fs.readFileSync('api/cron/qstash-batch-notifications.js', 'utf8');

// The main issue: The timing logic is too complex
// Let's simplify: For sessions happening in next 24 hours, send ALL notification types
// (3h, 30m, 24h) regardless of exact timing

// Find the notification loop and simplify it
const oldPattern = /for \(const \[notificationType, msBefore\] of Object\.entries\(notificationTimings\)\) \{[\s\S]*?if \(isNormalTiming \|\| shouldSendImmediately \|\| shouldSendForSoonSessions \|\| shouldSendForVerySoonSessions\) \{/;

// Actually, let's add a simpler approach: Send notifications for sessions happening soon
// Add this BEFORE the complex timing check

const newLogic = `// SIMPLIFIED: For sessions happening in next 24 hours, send notifications
        // This ensures notifications are sent even if timing windows are missed
        const sessionIsWithin24Hours = timeUntilSession > 0 && timeUntilSession <= 24 * 60 * 60 * 1000;
        const shouldSendForUpcomingSessions = sessionIsWithin24Hours && 
          (notificationType === '3_hours' || notificationType === '30_minutes' || notificationType === '24_hours');
        
        // Send notification if any condition is met
        if (isNormalTiming || shouldSendImmediately || shouldSendForSoonSessions || shouldSendForVerySoonSessions || shouldSendForUpcomingSessions) {`;

// Replace the if statement to include the new condition
content = content.replace(
  /if \(isNormalTiming \|\| shouldSendImmediately \|\| shouldSendForSoonSessions \|\| shouldSendForVerySoonSessions\) \{/,
  newLogic
);

fs.writeFileSync('api/cron/qstash-batch-notifications.js', content);
console.log('✅ Added simplified logic for sessions within 24 hours');
