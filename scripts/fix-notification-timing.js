// Quick fix: The notification system only checks future sessions
// But if sessions are created today, notifications should still be sent
// This script checks and explains the issue

console.log('🔍 NOTIFICATION SYSTEM ANALYSIS');
console.log('═'.repeat(60));

const today = new Date();
const now = today.getTime();

console.log(`Current time: ${today.toLocaleString()}`);

// Example: Session scheduled for today at 6:30 AM
const sessionTime = new Date(today);
sessionTime.setHours(6, 30, 0, 0);
const sessionTimeMs = sessionTime.getTime();

console.log(`\nExample session: Today at 6:30 AM`);
console.log(`Session time: ${sessionTime.toLocaleString()}`);

const notificationTimings = {
  '5_days': 5 * 24 * 60 * 60 * 1000,
  '48_hours': 48 * 60 * 60 * 1000,
  '24_hours': 24 * 60 * 60 * 1000,
  '3_hours': 3 * 60 * 60 * 1000,
  '30_minutes': 30 * 60 * 1000
};

console.log('\n📅 Notification Schedule:');
Object.entries(notificationTimings).forEach(([type, msBefore]) => {
  const notifyTime = new Date(sessionTimeMs - msBefore);
  const timeUntil = sessionTimeMs - now;
  const msUntil = msBefore - timeUntil;
  
  console.log(`\n${type}:`);
  console.log(`  Should send: ${notifyTime.toLocaleString()}`);
  console.log(`  Time until session: ${Math.round(msUntil / (60 * 60 * 1000))} hours`);
  
  if (msUntil < 0) {
    console.log(`  ⚠️  MISSED - This notification time has passed!`);
  } else if (msUntil < 5 * 60 * 1000) {
    console.log(`  ✅ DUE NOW - Within 5-minute window`);
  } else {
    console.log(`  ⏳ PENDING - Will send in ${Math.round(msUntil / (60 * 60 * 1000))} hours`);
  }
});

console.log('\n' + '═'.repeat(60));
console.log('💡 ISSUE IDENTIFIED:');
console.log('═'.repeat(60));
console.log('If sessions are created TODAY, notifications scheduled for:');
console.log('- 5 days ago (already passed)');
console.log('- 48 hours ago (already passed)');
console.log('- 24 hours ago (already passed)');
console.log('\nOnly these will send:');
console.log('- 3 hours before (if session is >3 hours away)');
console.log('- 30 minutes before (if session is >30 min away)');
console.log('\n✅ SOLUTION:');
console.log('1. Sessions should be created BEFORE they start (e.g., create sessions for next week)');
console.log('2. OR: Send immediate notifications when sessions are created');
console.log('3. OR: Adjust notification logic to send "late" notifications');
