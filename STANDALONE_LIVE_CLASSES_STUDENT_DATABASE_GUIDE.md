# Standalone Live Classes - Student Side Database Guide

## Overview

This guide explains how to fetch standalone live classes and their sessions from the database on the student side of the application. Standalone live classes are live classes that are not tied to courses and appear only in the Live Classes section.

---

## Database Schema

### 1. `live_classes` Table

Stores live class information (both course-based and standalone).

**Key Columns for Standalone Classes:**
```sql
- id (UUID, PRIMARY KEY)
- course_id (UUID, NULL for standalone classes)
- title (TEXT, REQUIRED for standalone - NOT NULL when course_id IS NULL)
- description (TEXT, Optional)
- cover_photo_url (TEXT, Optional - cover image URL)
- access_type (TEXT, 'free' | 'paid' - DEFAULT 'paid')
  - 'free': All classes accessible for free, forever
  - 'paid': First 2 classes free, rest require payment
- is_active (BOOLEAN, DEFAULT true)
- cycle_day (INTEGER, 1-5 - tracks video cycling)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Constraints:**
- Either `course_id` OR `title` must be present (CHECK constraint)
- `course_id` can be NULL (standalone classes)
- `title` must be present if `course_id` is NULL (standalone classes)
- `access_type` must be either `'free'` or `'paid'` (CHECK constraint)
- `access_type` defaults to `'paid'` if not specified
- `access_type` must be either `'free'` or `'paid'` (CHECK constraint)
- `access_type` defaults to `'paid'` if not specified

### 2. `standalone_live_class_videos` Table

Stores multiple videos for standalone live classes.

**Columns:**
```sql
- id (UUID, PRIMARY KEY)
- live_class_id (UUID, FOREIGN KEY → live_classes.id)
- name (TEXT, REQUIRED - video name/title)
- video_url (TEXT, REQUIRED - YouTube or direct video URL)
- video_title (TEXT, Optional - display title)
- video_description (TEXT, Optional - description)
- duration (TEXT, Optional - e.g., "15:30")
- order_index (INTEGER, REQUIRED - 0, 1, 2, ...)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Constraints:**
- `order_index >= 0`
- Unique `(live_class_id, order_index)` - one video per order position
- **Note:** Free access is determined by `live_classes.access_type`, not just order_index

### 3. `class_sessions` Table

Stores scheduled sessions for all live classes (course-based and standalone).

**Key Columns for Standalone Classes:**
```sql
- id (UUID, PRIMARY KEY)
- live_class_id (UUID, FOREIGN KEY → live_classes.id)
- course_video_id (UUID, NULL for standalone classes)
- video_url (TEXT, Required for standalone)
- video_title (TEXT, Optional)
- video_description (TEXT, Optional)
- session_type (TEXT, 'morning' | 'afternoon' | 'evening')
- scheduled_datetime (TIMESTAMPTZ, REQUIRED)
- status (TEXT, 'scheduled' | 'in_progress' | 'completed' | 'cancelled')
- is_free (BOOLEAN, DEFAULT false)
- available_slots (INTEGER, DEFAULT 25)
- current_slots (INTEGER, DEFAULT 25)
- started_at (TIMESTAMPTZ, Optional)
- ended_at (TIMESTAMPTZ, Optional)
```

**Constraints:**
- Either `course_video_id` OR `video_url` must be present (CHECK constraint)
- For standalone: `course_video_id` is NULL, `video_url` is present
- **Free Sessions:**
  - If `live_classes.access_type = 'free'`: ALL sessions are free
  - If `live_classes.access_type = 'paid'`: Only first 2 videos (order_index 0, 1) are free
- `is_free` field in `class_sessions` indicates if a session is free

---

## Identifying Standalone Live Classes

### How to Check if a Live Class is Standalone

```sql
-- Standalone classes have course_id = NULL
SELECT * FROM live_classes 
WHERE course_id IS NULL 
AND is_active = true;
```

**In Supabase Client (JavaScript/TypeScript):**
```typescript
const { data: standaloneClasses, error } = await supabase
  .from('live_classes')
  .select('*')
  .is('course_id', null)
  .eq('is_active', true);
```

---

## Access Type: FREE vs PAID

### Understanding Access Types

The `access_type` field in the `live_classes` table determines which sessions are free and which require payment/authentication.

**FREE (`access_type = 'free'`):**
- **All classes are accessible for free, forever**
- Every session created has `is_free = true`
- No authentication required for any session
- All videos (regardless of order_index) are free
- Ideal for promotional content, sample classes, or fully free courses

**PAID (`access_type = 'paid'`):**
- **First 2 classes (order_index 0 and 1) are free**
- Remaining classes require payment/authentication
- Only sessions with `is_free = true` are publicly accessible
- Default access type for most live classes
- Only the first 2 videos have `is_free = true` in their sessions

### How Access Type Affects Sessions

When sessions are created, the `is_free` field in `class_sessions` is set based on `live_classes.access_type`:

- **FREE live class (`access_type = 'free'`)**: 
  - ALL sessions have `is_free = true` regardless of video order_index
  - Every video, from first to last, is free
  
- **PAID live class (`access_type = 'paid'`)**: 
  - Only sessions for videos with `order_index < 2` have `is_free = true`
  - Sessions for videos with `order_index >= 2` have `is_free = false`
  - First 2 videos (order_index 0 and 1) are free, rest require payment

### Database Column Details

- **Column Name**: `access_type`
- **Type**: `TEXT`
- **Default**: `'paid'`
- **Values**: `'free'` or `'paid'` (CHECK constraint)
- **Nullable**: No (has default value)
- **Migration**: Added via `20260108_003_add_access_type_to_live_classes.sql`
- **Existing Records**: All existing records are automatically set to `'paid'` when migration is run

## Fetching Standalone Live Classes

### 1. Get All Active Standalone Live Classes

**SQL:**
```sql
SELECT 
  id,
  title,
  description,
  cover_photo_url,
  access_type,
  is_active,
  created_at
FROM live_classes
WHERE course_id IS NULL
  AND is_active = true
ORDER BY created_at DESC;
```

**Supabase Client:**
```typescript
const { data: standaloneClasses, error } = await supabase
  .from('live_classes')
  .select(`
    id,
    title,
    description,
    cover_photo_url,
    access_type,
    is_active,
    created_at
  `)
  .is('course_id', null)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

### 2. Get Standalone Live Class with Videos

**SQL:**
```sql
SELECT 
  lc.id,
  lc.title,
  lc.description,
  lc.cover_photo_url,
  lc.access_type,
  lc.is_active,
  json_agg(
    json_build_object(
      'id', v.id,
      'name', v.name,
      'video_url', v.video_url,
      'video_title', v.video_title,
      'video_description', v.video_description,
      'duration', v.duration,
      'order_index', v.order_index
    ) ORDER BY v.order_index
  ) as videos
FROM live_classes lc
LEFT JOIN standalone_live_class_videos v ON v.live_class_id = lc.id
WHERE lc.id = :live_class_id
  AND lc.course_id IS NULL
GROUP BY lc.id;
```

**Supabase Client:**
```typescript
const { data: liveClass, error } = await supabase
  .from('live_classes')
  .select(`
    id,
    title,
    description,
    cover_photo_url,
    access_type,
    is_active,
    standalone_live_class_videos (
      id,
      name,
      video_url,
      video_title,
      video_description,
      duration,
      order_index
    )
  `)
  .eq('id', liveClassId)
  .is('course_id', null)
  .single();

// Videos are automatically sorted by order_index in the relation

// Check access type
if (liveClass.access_type === 'free') {
  console.log('All classes are free!');
} else {
  console.log('First 2 classes are free, rest require payment');
}
```

---

## Fetching Sessions for Standalone Live Classes

### 1. Get All Upcoming Sessions for a Standalone Live Class

**SQL:**
```sql
SELECT 
  cs.id,
  cs.live_class_id,
  cs.video_url,
  cs.video_title,
  cs.video_description,
  cs.session_type,
  cs.scheduled_datetime,
  cs.status,
  cs.is_free,
  cs.current_slots,
  cs.available_slots,
  lc.title as class_title,
  lc.description as class_description,
  lc.cover_photo_url
FROM class_sessions cs
INNER JOIN live_classes lc ON lc.id = cs.live_class_id
WHERE cs.live_class_id = :live_class_id
  AND lc.course_id IS NULL
  AND lc.is_active = true
  AND cs.scheduled_datetime >= NOW()
ORDER BY cs.scheduled_datetime ASC;
```

**Supabase Client:**
```typescript
const { data: sessions, error } = await supabase
  .from('class_sessions')
  .select(`
    id,
    live_class_id,
    video_url,
    video_title,
    video_description,
    session_type,
    scheduled_datetime,
    status,
    is_free,
    current_slots,
    available_slots,
    live_classes!inner (
      title,
      description,
      cover_photo_url,
      is_active,
      course_id
    )
  `)
  .eq('live_class_id', liveClassId)
  .is('live_classes.course_id', null)
  .eq('live_classes.is_active', true)
  .gte('scheduled_datetime', new Date().toISOString())
  .order('scheduled_datetime', { ascending: true });
```

### 2. Get Free Public Sessions (No Auth Required)

**SQL:**
```sql
SELECT 
  cs.id,
  cs.live_class_id,
  cs.video_url,
  cs.video_title,
  cs.video_description,
  cs.session_type,
  cs.scheduled_datetime,
  cs.status,
  cs.is_free,
  lc.title as class_title,
  lc.description as class_description
FROM class_sessions cs
INNER JOIN live_classes lc ON lc.id = cs.live_class_id
WHERE lc.course_id IS NULL
  AND lc.is_active = true
  AND cs.is_free = true
  AND cs.scheduled_datetime >= NOW()
ORDER BY cs.scheduled_datetime ASC
LIMIT 50;
```

**Supabase Client (Public/Anon Key):**
```typescript
const { data: freeSessions, error } = await supabase
  .from('class_sessions')
  .select(`
    id,
    live_class_id,
    video_url,
    video_title,
    video_description,
    session_type,
    scheduled_datetime,
    status,
    is_free,
    live_classes!inner (
      title,
      description,
      cover_photo_url,
      course_id,
      is_active
    )
  `)
  .is('live_classes.course_id', null)
  .eq('live_classes.is_active', true)
  .eq('is_free', true)
  .gte('scheduled_datetime', new Date().toISOString())
  .order('scheduled_datetime', { ascending: true })
  .limit(50);
```

### 3. Get Individual Session (Public Access - First 2 Videos)

**SQL:**
```sql
SELECT 
  cs.id,
  cs.live_class_id,
  cs.video_url,
  cs.video_title,
  cs.video_description,
  cs.session_type,
  cs.scheduled_datetime,
  cs.status,
  cs.is_free,
  lc.title as class_title,
  lc.description as class_description,
  v.order_index
FROM class_sessions cs
INNER JOIN live_classes lc ON lc.id = cs.live_class_id
LEFT JOIN standalone_live_class_videos v 
  ON v.live_class_id = lc.id 
  AND v.video_url = cs.video_url
WHERE cs.id = :session_id
  AND lc.course_id IS NULL
  AND lc.is_active = true
  AND (cs.is_free = true OR (v.order_index IS NOT NULL AND v.order_index < 2));
```

**Via Public API Endpoint (Recommended):**
```typescript
const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await fetch(`${apiBaseUrl}/api/admin/live-booth/public/session/${sessionId}`);
const result = await response.json();

if (result.success) {
  const session = result.data;
  // session contains all session details
}
```

---

## Key Differences: Standalone vs Course-Based

| Feature | Standalone | Course-Based |
|---------|-----------|--------------|
| **course_id** | `NULL` | UUID (not null) |
| **title** | `title` field | `courses.title` |
| **description** | `description` field | `courses.description` |
| **videos** | `standalone_live_class_videos` table | `course_videos` table |
| **session video** | `class_sessions.video_url` | `class_sessions.course_video_id` → `course_videos.link` |
| **cover image** | `cover_photo_url` field | `courses.cover_photo_url` |
| **access type** | `access_type` field ('free' or 'paid') | Always 'paid' (tied to course pricing) |

---

## Query Patterns for Students

### Pattern 1: List All Active Standalone Live Classes

```typescript
const fetchStandaloneLiveClasses = async () => {
  const { data, error } = await supabase
    .from('live_classes')
    .select(`
      id,
      title,
      description,
      cover_photo_url,
      access_type,
      is_active,
      created_at
    `)
    .is('course_id', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
```

### Pattern 2: Get Standalone Live Class Details with Videos

```typescript
const fetchStandaloneLiveClassDetails = async (liveClassId: string) => {
  const { data, error } = await supabase
    .from('live_classes')
    .select(`
      id,
      title,
      description,
      cover_photo_url,
      access_type,
      is_active,
      standalone_live_class_videos (
        id,
        name,
        video_url,
        video_title,
        video_description,
        duration,
        order_index
      )
    `)
    .eq('id', liveClassId)
    .is('course_id', null)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  
  // Log access type info
  if (data.access_type === 'free') {
    console.log('✅ All classes are free!');
  } else {
    console.log('ℹ️ First 2 classes are free, rest require payment');
  }
  
  return data;
};
```

### Pattern 3: Get Upcoming Sessions for Standalone Live Class

```typescript
const fetchUpcomingSessions = async (liveClassId: string) => {
  const { data, error } = await supabase
    .from('class_sessions')
    .select(`
      id,
      live_class_id,
      video_url,
      video_title,
      video_description,
      session_type,
      scheduled_datetime,
      status,
      is_free,
      current_slots,
      available_slots,
      live_classes!inner (
        title,
        description,
        cover_photo_url,
        course_id
      )
    `)
    .eq('live_class_id', liveClassId)
    .is('live_classes.course_id', null)
    .eq('live_classes.is_active', true)
    .gte('scheduled_datetime', new Date().toISOString())
    .order('scheduled_datetime', { ascending: true });

  if (error) throw error;
  return data;
};
```

### Pattern 4: Get Free Public Sessions (No Auth Required)

```typescript
const fetchFreePublicSessions = async () => {
  const { data, error } = await supabase
    .from('class_sessions')
    .select(`
      id,
      live_class_id,
      video_url,
      video_title,
      video_description,
      session_type,
      scheduled_datetime,
      status,
      is_free,
      live_classes!inner (
        title,
        description,
        cover_photo_url,
        access_type,
        course_id,
        is_active
      )
    `)
    .is('live_classes.course_id', null)
    .eq('live_classes.is_active', true)
    .eq('is_free', true) // Only free sessions (already filtered based on access_type)
    .gte('scheduled_datetime', new Date().toISOString())
    .order('scheduled_datetime', { ascending: true })
    .limit(50);

  if (error) throw error;
  return data;
};
```

### Pattern 5: Get Session by ID (Public Access - First 2 Videos Only)

```typescript
const fetchPublicSession = async (sessionId: string) => {
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const response = await fetch(
    `${apiBaseUrl}/api/admin/live-booth/public/session/${sessionId}`
  );
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch session');
  }
  
  return result.data;
};
```

---

## RLS (Row Level Security) Policies

### Public Access (No Authentication Required)

**Policies that allow public read access:**

1. **live_classes**: Public can view all active live classes
   ```sql
   CREATE POLICY "Public can view all live classes" 
     ON live_classes FOR SELECT 
     USING (true);
   ```

2. **standalone_live_class_videos**: Public can view all videos
   ```sql
   CREATE POLICY "Public can view standalone live class videos" 
     ON standalone_live_class_videos FOR SELECT 
     USING (true);
   ```

3. **class_sessions**: Public can view all sessions
   ```sql
   CREATE POLICY "Users can view scheduled sessions" 
     ON class_sessions FOR SELECT 
     USING (true);
   ```

**Note:** These policies allow **read access** only. Students can view but cannot modify data.

---

## Video Cycling Logic

### How Videos Cycle in Sessions

Standalone live classes cycle through videos indefinitely:

1. **Initial Creation**: Creates 30 days of sessions, cycling through videos
2. **Auto-Extension**: Every 7 days, automatically extends another 30 days
3. **Cycle Pattern**: 
   - Day 1 → Video 0 (order_index 0)
   - Day 2 → Video 1 (order_index 1)
   - Day 3 → Video 2 (order_index 2)
   - ...
   - Day N → Video N % total_videos

### Determining Which Video is in a Session

```typescript
// For a given session, the video is already stored in class_sessions table
// For standalone: check video_url, video_title, video_description
// For course-based: check course_video_id → join with course_videos

const getSessionVideo = (session: ClassSession) => {
  if (session.video_url) {
    // Standalone class - direct video URL
    return {
      type: 'standalone',
      url: session.video_url,
      title: session.video_title,
      description: session.video_description
    };
  } else if (session.course_video_id) {
    // Course-based class - fetch from course_videos
    return {
      type: 'course',
      videoId: session.course_video_id,
      // Need to join with course_videos to get link, name, etc.
    };
  }
};
```

---

## Free vs Paid Sessions

### Determining Free Sessions Based on Access Type

**For FREE Live Classes (`access_type = 'free'`):**
- ALL sessions have `is_free = true`
- All sessions are publicly accessible
- No authentication required for any session
- Check: `live_classes.access_type = 'free'` → All sessions are free

**For PAID Live Classes (`access_type = 'paid'`):**
- Only first 2 videos (order_index 0, 1) have `is_free = true`
- Remaining videos have `is_free = false`
- Only free sessions are publicly accessible
- Check: `live_classes.access_type = 'paid'` AND `class_sessions.is_free = true` (for first 2 videos)

### Free Sessions (Public Access - No Sign-In Required)

**Criteria:**
1. **FREE live class**: `live_classes.access_type = 'free'` → All sessions are free
2. **PAID live class**: `class_sessions.is_free = true` (first 2 videos only)

**Query for Free Sessions:**
```typescript
const getFreeSessions = async (liveClassId: string) => {
  // First, get the live class to check access_type
  const { data: liveClass } = await supabase
    .from('live_classes')
    .select('access_type')
    .eq('id', liveClassId)
    .single();

  // Then get sessions
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select('*')
    .eq('live_class_id', liveClassId);

  if (liveClass.access_type === 'free') {
    // All sessions are free for FREE live classes
    return sessions.filter(s => s.scheduled_datetime >= new Date().toISOString());
  } else {
    // Only sessions with is_free = true are free for PAID live classes
    return sessions.filter(s => s.is_free === true && s.scheduled_datetime >= new Date().toISOString());
  }
};
```

**Simple Query (Check `is_free` field):**
```typescript
// The is_free field is already set correctly based on access_type
// So you can simply filter by is_free = true
const { data: freeSessions } = await supabase
  .from('class_sessions')
  .select('*')
  .eq('live_class_id', liveClassId)
  .eq('is_free', true)
  .gte('scheduled_datetime', new Date().toISOString());
```

### Paid Sessions (Authentication Required)

**For PAID Live Classes:**
- Sessions with `is_free = false` (videos with order_index >= 2)
- Requires user authentication and access verification
- Check user's subscription/payment status before allowing access

**Query for Paid Sessions:**
```typescript
const { data: paidSessions } = await supabase
  .from('class_sessions')
  .select('*')
  .eq('live_class_id', liveClassId)
  .eq('is_free', false)
  .gte('scheduled_datetime', new Date().toISOString());
```

---

## Complete Example: Fetch Standalone Live Class with Sessions

```typescript
interface StandaloneLiveClass {
  id: string;
  title: string;
  description: string | null;
  cover_photo_url: string | null;
  is_active: boolean;
  videos: StandaloneVideo[];
  upcomingSessions: ClassSession[];
}

interface StandaloneVideo {
  id: string;
  name: string;
  video_url: string;
  video_title: string | null;
  video_description: string | null;
  duration: string | null;
  order_index: number;
}

interface ClassSession {
  id: string;
  live_class_id: string;
  video_url: string;
  video_title: string | null;
  video_description: string | null;
  session_type: 'morning' | 'afternoon' | 'evening';
  scheduled_datetime: string;
  status: string;
  is_free: boolean;
  current_slots: number;
  available_slots: number;
}

const fetchStandaloneLiveClassComplete = async (liveClassId: string): Promise<StandaloneLiveClass> => {
  // 1. Fetch live class with videos
  const { data: liveClass, error: classError } = await supabase
    .from('live_classes')
    .select(`
      id,
      title,
      description,
      cover_photo_url,
      is_active,
      standalone_live_class_videos (
        id,
        name,
        video_url,
        video_title,
        video_description,
        duration,
        order_index
      )
    `)
    .eq('id', liveClassId)
    .is('course_id', null)
    .eq('is_active', true)
    .single();

  if (classError) throw classError;

  // 2. Fetch upcoming sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('class_sessions')
    .select(`
      id,
      live_class_id,
      video_url,
      video_title,
      video_description,
      session_type,
      scheduled_datetime,
      status,
      is_free,
      current_slots,
      available_slots
    `)
    .eq('live_class_id', liveClassId)
    .gte('scheduled_datetime', new Date().toISOString())
    .order('scheduled_datetime', { ascending: true });

  if (sessionsError) throw sessionsError;

  return {
    id: liveClass.id,
    title: liveClass.title!,
    description: liveClass.description,
    cover_photo_url: liveClass.cover_photo_url,
    is_active: liveClass.is_active,
    videos: liveClass.standalone_live_class_videos || [],
    upcomingSessions: sessions || []
  };
};
```

---

## Public API Endpoints

### 1. Get Free Sessions (No Auth Required)

**Endpoint:** `GET /api/admin/live-booth/public/free-sessions`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session-id",
      "live_class_id": "live-class-id",
      "video_url": "https://youtube.com/...",
      "video_title": "Video Title",
      "session_type": "morning",
      "scheduled_datetime": "2026-01-09T06:30:00Z",
      "status": "scheduled",
      "is_free": true,
      "live_classes": {
        "title": "Standalone Live Class Title",
        "description": "Description",
        "course_id": null
      }
    }
  ],
  "count": 50
}
```

### 2. Get Individual Session (No Auth - First 2 Videos Only)

**Endpoint:** `GET /api/admin/live-booth/public/session/:sessionId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-id",
    "live_class_id": "live-class-id",
    "video_url": "https://youtube.com/...",
    "video_title": "Video Title",
    "video_description": "Description",
    "session_type": "morning",
    "scheduled_datetime": "2026-01-09T06:30:00Z",
    "status": "scheduled",
    "is_free": true,
    "live_classes": {
      "title": "Standalone Live Class Title",
      "description": "Description",
      "course_id": null
    }
  }
}
```

---

## Error Handling

### Common Errors and Solutions

1. **"No rows returned"**
   - Check if `is_active = true`
   - Verify `course_id IS NULL` for standalone classes
   - Ensure sessions have `scheduled_datetime >= NOW()`

2. **RLS Policy Violation**
   - Use anon key for public access
   - Ensure policies allow `FOR SELECT` with `USING (true)`
   - Check if `is_admin()` function exists and is `SECURITY DEFINER`

3. **Missing Videos**
   - Verify `standalone_live_class_videos` table exists
   - Check if videos are linked to correct `live_class_id`
   - Ensure `order_index` is set correctly

---

## Best Practices

1. **Always filter by `is_active = true`** to exclude stopped live classes
2. **Use `course_id IS NULL`** to identify standalone classes
3. **Order sessions by `scheduled_datetime`** for chronological display
4. **Check `is_free` flag** for public access (first 2 videos)
5. **Use public API endpoints** for free sessions (simpler, handles RLS)
6. **Join with `live_classes`** to get title, description, cover image
7. **Handle null values** for optional fields (description, cover_photo_url)

---

## Summary

- **Standalone live classes**: `course_id = NULL`, use `title` field
- **Videos**: Stored in `standalone_live_class_videos` table
- **Sessions**: Stored in `class_sessions` with `video_url` (not `course_video_id`)
- **Access Type (`access_type`)**:
  - `'free'`: All classes are free, forever. All sessions have `is_free = true`
  - `'paid'`: First 2 videos (order_index < 2) are free. Only those sessions have `is_free = true`
- **Free sessions**: 
  - For FREE classes: ALL sessions are free (`is_free = true`)
  - For PAID classes: Only first 2 videos have `is_free = true`
  - Check `class_sessions.is_free` field to determine if a session is free
- **Auto-extension**: Sessions extend automatically every 30 days indefinitely
- **Public access**: No authentication required for sessions with `is_free = true`

---

**Last Updated**: January 2026  
**Version**: 1.0
