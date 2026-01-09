# Live Classes Dynamic Session Analysis

## Problem Statement

**Current Issue:**
- Each session has a unique ID tied to a specific date
- Link: `/live-classes/{liveClassId}/session/{sessionId}`
- If accessed tomorrow, shows yesterday's video (old session)
- Need: **Same link, fresh content** based on current date/time

**Desired Behavior:**
- **ONE link** per live class that always shows the "current" session
- Link stays the same, but content changes based on:
  - **Current date** (which day in the cycle)
  - **Current time** (morning 6:30 AM, afternoon 1:00 PM, evening 7:30 PM)
- Accessing tomorrow → shows tomorrow's video automatically
- Like a "live stream" experience

---

## Current Implementation

### Current Flow:
1. Sessions are pre-created with unique IDs
2. Each session has `scheduled_datetime` tied to specific date/time
3. Route: `/live-classes/{liveClassId}/session/{sessionId}`
4. Fetches specific session by ID → shows that session's video

### Problem:
- Session ID is tied to a past date
- Accessing old session ID → shows old video
- No way to get "current" session dynamically

---

## Proposed Solution: Dynamic "Live" Route

### New Route Structure:

**Option A: New Route (Recommended)**
```
/live-classes/{liveClassId}/live
```
- Always shows current session based on today's date/time
- No session ID needed
- Dynamic content

**Option B: Keep Both**
```
/live-classes/{liveClassId}/session/{sessionId}  → Specific session (backward compatible)
/live-classes/{liveClassId}/live                → Current live session (new)
```

### How It Works:

1. **User accesses:** `/live-classes/{liveClassId}/live`

2. **Backend calculates:**
   - Get current date/time
   - Determine which day in the cycle (Day 1, Day 2, Day 3, etc.)
   - Determine current session type (morning/afternoon/evening) based on time
   - Find or calculate which video should be playing NOW

3. **Logic:**
   ```javascript
   // Get live class start date (first session date)
   const startDate = getFirstSessionDate(liveClassId);
   
   // Calculate current day in cycle
   const today = new Date();
   const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
   
   // Get videos for this live class
   const videos = getVideos(liveClassId);
   
   // Calculate which video (cycles through)
   const videoIndex = daysSinceStart % videos.length;
   const currentVideo = videos[videoIndex];
   
   // Determine session type based on current time
   const currentHour = today.getHours();
   let sessionType = 'evening'; // default
   if (currentHour >= 6 && currentHour < 13) {
     sessionType = 'morning';
   } else if (currentHour >= 13 && currentHour < 19) {
     sessionType = 'afternoon';
   }
   
   // Return current session data
   return {
     video: currentVideo,
     session_type: sessionType,
     scheduled_date: today.toISOString().split('T')[0],
     is_live: true
   };
   ```

---

## Implementation Plan

### Phase 1: Backend - New Dynamic Endpoint ✅

**File:** `server/routes/liveBooth.js`

**New Endpoint:**
```javascript
// GET /api/admin/live-booth/public/live/:liveClassId
router.get('/public/live/:liveClassId', async (req, res) => {
  try {
    const { liveClassId } = req.params;
    const now = new Date();
    
    // Get live class details
    const { data: liveClass } = await supabase
      .from('live_classes')
      .select('id, course_id, title, access_type, is_active, created_at')
      .eq('id', liveClassId)
      .eq('is_active', true)
      .single();
    
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class not found' });
    }
    
    // Get first session date (when live class started)
    const { data: firstSession } = await supabase
      .from('class_sessions')
      .select('scheduled_datetime')
      .eq('live_class_id', liveClassId)
      .order('scheduled_datetime', { ascending: true })
      .limit(1)
      .single();
    
    if (!firstSession) {
      return res.status(404).json({ success: false, message: 'No sessions found' });
    }
    
    const startDate = new Date(firstSession.scheduled_datetime);
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate days since start
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    // Get videos
    let videos = [];
    const isStandalone = !liveClass.course_id;
    
    if (isStandalone) {
      const { data: standaloneVideos } = await supabase
        .from('standalone_live_class_videos')
        .select('id, name, video_url, video_title, video_description, order_index')
        .eq('live_class_id', liveClassId)
        .order('order_index', { ascending: true });
      videos = standaloneVideos || [];
    } else {
      const { data: courseVideos } = await supabase
        .from('course_videos')
        .select('id, name, link, order_index')
        .eq('course_id', liveClass.course_id)
        .order('order_index', { ascending: true });
      videos = courseVideos || [];
    }
    
    if (videos.length === 0) {
      return res.status(404).json({ success: false, message: 'No videos found' });
    }
    
    // Calculate which video should be playing today
    const videoIndex = daysSinceStart % videos.length;
    const currentVideo = videos[videoIndex];
    
    // Determine session type based on current time
    const currentHour = now.getHours();
    let sessionType = 'evening';
    if (currentHour >= 6 && currentHour < 13) {
      sessionType = 'morning';
    } else if (currentHour >= 13 && currentHour < 19) {
      sessionType = 'afternoon';
    }
    
    // Determine if free
    const isFree = liveClass.access_type === 'free' 
      ? true 
      : (currentVideo.order_index < 2);
    
    // Build response
    const sessionData = {
      live_class_id: liveClassId,
      video: currentVideo,
      session_type: sessionType,
      scheduled_date: today.toISOString().split('T')[0],
      scheduled_datetime: now.toISOString(),
      is_free: isFree,
      is_live: true,
      live_classes: {
        course_id: liveClass.course_id,
        title: liveClass.title,
        description: liveClass.description
      }
    };
    
    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error in public/live:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});
```

### Phase 2: Frontend - New Component/Route ✅

**File:** `src/components/LiveClassLiveView.tsx` (new)

**Route:** Add to `src/App.tsx`
```typescript
<Route path="/live-classes/:liveClassId/live" element={<LiveClassLiveView />} />
```

**Component Logic:**
- Fetches from `/api/admin/live-booth/public/live/:liveClassId`
- Displays current video based on today's date/time
- Auto-refreshes or shows "Live" indicator
- Same UI as `LiveClassSessionView` but dynamic

### Phase 3: Update Links/Sharing ✅

**Where links are generated:**
- Update to use `/live-classes/{liveClassId}/live` instead of `/live-classes/{liveClassId}/session/{sessionId}`
- Keep old route for backward compatibility
- Add redirect: old session links → redirect to `/live` route

---

## Key Logic Details

### 1. **Day Calculation**
```javascript
// Start date: First session's scheduled_datetime
const startDate = new Date(firstSession.scheduled_datetime);
startDate.setHours(0, 0, 0, 0);

// Today
const today = new Date();
today.setHours(0, 0, 0, 0);

// Days since start
const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

// Video index (cycles)
const videoIndex = daysSinceStart % videos.length;
```

### 2. **Session Type (Time-based)**
```javascript
const currentHour = new Date().getHours();

if (currentHour >= 6 && currentHour < 13) {
  sessionType = 'morning';    // 6:00 AM - 12:59 PM
} else if (currentHour >= 13 && currentHour < 19) {
  sessionType = 'afternoon';  // 1:00 PM - 6:59 PM
} else {
  sessionType = 'evening';   // 7:00 PM - 5:59 AM
}
```

### 3. **Video Cycling**
- Day 0: Video 0 (index 0)
- Day 1: Video 1 (index 1)
- Day 2: Video 2 (index 2)
- ...
- Day N: Video N % totalVideos
- Cycles back to Video 0 after all videos shown

### 4. **Free vs Paid**
- FREE (`access_type = 'free'`): All videos free
- PAID (`access_type = 'paid'`): Only first 2 videos (order_index < 2) free

---

## Benefits

### ✅ Always Fresh Content
- Same link, always shows current video
- No stale sessions

### ✅ Simpler Sharing
- One link per live class
- No need to generate new links daily

### ✅ Live Experience
- Feels like a live stream
- Content changes automatically

### ✅ Backward Compatible
- Old session links still work
- Can redirect to new `/live` route

---

## Edge Cases & Considerations

### 1. **Before First Session**
- What if accessed before first scheduled session?
- **Solution:** Show first video (Day 0)

### 2. **Between Sessions**
- What if accessed at 12:30 PM (between morning and afternoon)?
- **Solution:** Show current session type based on time window

### 3. **No Sessions Created Yet**
- What if live class exists but no sessions?
- **Solution:** Return error or create sessions on-the-fly

### 4. **Time Zones**
- Which timezone to use?
- **Solution:** Use server timezone or UTC, convert on frontend

### 5. **Caching**
- Should we cache the current session?
- **Solution:** Cache for 1 hour, then refresh

---

## Migration Strategy

### Option A: Redirect Old Links
```javascript
// Old route redirects to new route
router.get('/public/session/:sessionId', async (req, res) => {
  // Get live_class_id from session
  // Redirect to /public/live/:liveClassId
  res.redirect(`/api/admin/live-booth/public/live/${liveClassId}`);
});
```

### Option B: Keep Both
- Old route: Specific session by ID (for history/records)
- New route: Current live session (for active viewing)

---

## Questions to Answer

1. **Route Name:**
   - `/live-classes/{liveClassId}/live` ✅ (recommended)
   - `/live-classes/{liveClassId}/current`
   - `/live-classes/{liveClassId}/now`

2. **Time Windows:**
   - Morning: 6:00 AM - 12:59 PM ✅
   - Afternoon: 1:00 PM - 6:59 PM ✅
   - Evening: 7:00 PM - 5:59 AM ✅
   - Or different times?

3. **Before First Session:**
   - Show first video? ✅
   - Show "Coming Soon"?

4. **Old Links:**
   - Redirect to `/live`? ✅
   - Keep both routes?

5. **Auto-refresh:**
   - Should page auto-refresh when session changes?
   - Or manual refresh?

---

## Implementation Checklist

- [ ] Create backend endpoint `/public/live/:liveClassId`
- [ ] Implement day calculation logic
- [ ] Implement session type detection (time-based)
- [ ] Handle video cycling
- [ ] Create frontend component `LiveClassLiveView`
- [ ] Add route to `App.tsx`
- [ ] Update links to use new route
- [ ] Add redirect for old session links (optional)
- [ ] Test with different times (morning/afternoon/evening)
- [ ] Test video cycling
- [ ] Test free vs paid logic
- [ ] Update documentation

---

**Ready to implement!** 🚀

This will give you a "live" experience where the same link always shows the current session based on today's date and time.
