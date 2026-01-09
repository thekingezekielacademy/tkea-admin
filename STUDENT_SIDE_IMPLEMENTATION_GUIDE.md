# Student Side Implementation Guide - Dynamic Live Sessions

## ✅ Backend Implementation Status

**GOOD NEWS:** The backend is **already fully implemented** and handles all the dynamic logic!

### What's Already Done (Backend)

The endpoint `/api/admin/live-booth/public/session/:sessionId` now:

1. ✅ **Extracts liveClassId** from sessionId lookup
2. ✅ **Calculates current day** in cycle (`daysSinceStart`)
3. ✅ **Determines which video** should play today (`videoIndex = daysSinceStart % videos.length`)
4. ✅ **Detects time window** automatically:
   - Morning: 6:00 AM - 12:59 PM
   - Afternoon: 1:00 PM - 6:59 PM
   - Evening: 7:00 PM - 5:59 AM
5. ✅ **Returns current session** data dynamically

**Key Point:** The backend **already returns the current session** based on date/time. No redirect needed!

---

## 🎯 What Student Side Needs to Do

### Option 1: Use Existing Route (Simplest) ✅ RECOMMENDED

**The existing route already works dynamically!**

**Route:** `/live-classes/:liveClassId/session/:sessionId`

**How it works:**
- User clicks link: `/live-classes/{liveClassId}/session/{sessionId}`
- Frontend calls: `/api/admin/live-booth/public/session/{sessionId}?liveClassId={liveClassId}`
- Backend returns: **Current session** based on today's date/time
- Frontend displays: Current session (not the old sessionId)

**Implementation:**
```typescript
// In LiveClassSessionView.tsx (already updated)
const fetchSession = async () => {
  const response = await fetch(
    `${apiBaseUrl}/api/admin/live-booth/public/session/${sessionId}?liveClassId=${liveClassId}`
  );
  // Backend automatically returns CURRENT session, not the sessionId
  const result = await response.json();
  setSession(result.data); // This is the current session!
};
```

**Result:** Same link, always shows current session ✅

---

### Option 2: New Route (If You Want Cleaner URLs)

If you want a cleaner URL like `/live-classes/:liveClassId/live`, you can:

**Frontend Route:**
```typescript
<Route path="/live-classes/:liveClassId/live" element={<LiveClassLiveView />} />
```

**Component:**
```typescript
const LiveClassLiveView = () => {
  const { liveClassId } = useParams();
  
  useEffect(() => {
    fetchCurrentSession();
  }, [liveClassId]);
  
  const fetchCurrentSession = async () => {
    // Use any sessionId or generate one - backend ignores it
    const dummySessionId = 'current'; // or generate UUID
    const response = await fetch(
      `${apiBaseUrl}/api/admin/live-booth/public/session/${dummySessionId}?liveClassId=${liveClassId}`
    );
    const result = await response.json();
    setSession(result.data); // Current session!
  };
};
```

**But this is optional** - Option 1 already works!

---

## 🔍 Understanding the Backend Response

### What Backend Returns

When you call `/api/admin/live-booth/public/session/:sessionId`, the backend:

1. **Ignores the sessionId** (uses it only to lookup liveClassId)
2. **Calculates current day**: `daysSinceStart = (today - startDate) / days`
3. **Gets today's video**: `videoIndex = daysSinceStart % videos.length`
4. **Determines session type** based on current time:
   ```javascript
   if (currentHour >= 6 && currentHour < 13) {
     sessionType = 'morning';
   } else if (currentHour >= 13 && currentHour < 19) {
     sessionType = 'afternoon';
   } else {
     sessionType = 'evening';
   }
   ```
5. **Returns session data** with:
   - Today's video
   - Current session type
   - Current scheduled_datetime
   - is_free status

### Example Response

```json
{
  "success": true,
  "data": {
    "id": "session-id-from-request",
    "live_class_id": "live-class-id",
    "video_url": "https://youtube.com/...",
    "video_title": "Video 3 - Day 3",
    "session_type": "afternoon",  // Based on current time
    "scheduled_datetime": "2026-01-09T13:00:00Z",  // Today's date
    "is_free": true,
    "live_classes": {
      "title": "Live Class Title",
      "course_id": null
    }
  }
}
```

---

## ✅ Implementation Checklist for Student Side

### Already Done ✅
- [x] Backend endpoint returns current session dynamically
- [x] Time window detection (morning/afternoon/evening)
- [x] Video cycling logic (day-based)
- [x] Free/paid logic

### What Student Side Needs (Minimal) ✅

**Option A: Use Existing Route (Recommended)**
- [x] Frontend already updated to pass `liveClassId` as query param
- [x] Backend extracts and uses it
- [x] **DONE** - Just use the existing route!

**Option B: New Route (Optional)**
- [ ] Create new route `/live-classes/:liveClassId/live`
- [ ] Create component `LiveClassLiveView.tsx`
- [ ] Call same backend endpoint with dummy sessionId
- [ ] Display current session

---

## 🎯 Recommendation

### Tell Student Side Agent:

**"The backend is already fully implemented! The existing route `/live-classes/:liveClassId/session/:sessionId` already works dynamically. When you call the backend endpoint, it automatically returns the CURRENT session based on today's date and time - not the sessionId you passed.**

**No new route needed. No redirect needed. No time window utility needed. The backend handles everything.**

**Just use the existing `LiveClassSessionView` component - it already works! The backend will return the current session automatically."**

---

## 📝 Key Points to Communicate

1. ✅ **Backend is complete** - All logic implemented
2. ✅ **Existing route works** - No new route needed
3. ✅ **No redirect needed** - Backend returns current session directly
4. ✅ **No time utilities needed** - Backend handles time detection
5. ✅ **Frontend already updated** - Just needs to use existing component

---

## 🔧 If They Want to Add New Route Anyway

If they still want a cleaner URL like `/live-classes/:liveClassId/live`, here's what they need:

### 1. Time Window Utility (Optional - Backend Already Has This)

```typescript
// utils/sessionTime.ts
export const getCurrentSessionType = (): 'morning' | 'afternoon' | 'evening' => {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 13) {
    return 'morning';
  } else if (hour >= 13 && hour < 19) {
    return 'afternoon';
  } else {
    return 'evening';
  }
};
```

### 2. Current Session Finder (Backend Already Does This)

**No need** - Backend endpoint already returns current session!

### 3. New Route Component

```typescript
// components/LiveClassLiveView.tsx
import { useParams } from 'react-router-dom';
import LiveClassSessionView from './LiveClassSessionView';

const LiveClassLiveView = () => {
  const { liveClassId } = useParams();
  
  // Generate a dummy sessionId - backend will ignore it
  const dummySessionId = 'current-' + liveClassId;
  
  // Use existing component, but with dummy sessionId
  return <LiveClassSessionView liveClassId={liveClassId} sessionId={dummySessionId} />;
};
```

**But again, this is optional** - existing route already works!

---

## 🎉 Summary

**Tell the student side agent:**

> "The backend implementation is complete! The endpoint `/api/admin/live-booth/public/session/:sessionId` already returns the CURRENT session dynamically based on date/time. You don't need to implement time windows, session finders, or redirects - the backend handles everything.
>
> Just use the existing `LiveClassSessionView` component. When users access `/live-classes/:liveClassId/session/:sessionId`, the backend automatically returns today's session for the current time window. Same link, always current!
>
> If you want a cleaner URL like `/live-classes/:liveClassId/live`, you can create a new route that calls the same backend endpoint with a dummy sessionId - but it's optional. The existing route already works perfectly."

---

**Status:** ✅ Backend Complete | ✅ Frontend Updated | ✅ Ready to Use
