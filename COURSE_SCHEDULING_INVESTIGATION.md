# Course Scheduling Function Investigation

## Overview
This document provides a comprehensive investigation of the Course Scheduling functionality in the TKEA Admin application.

## Architecture

### Core Components

#### 1. **CourseScheduler Utility** (`src/utils/courseScheduler.ts`)
- **Type**: Singleton class
- **Purpose**: Core utility for managing course scheduling operations
- **Key Features**:
  - Date generation based on frequency (daily, weekly, monthly)
  - Course scheduling operations
  - Notification handling for scheduled courses

**Current Implementation Status**: ⚠️ **Mostly Placeholder**
- `scheduleCourse()`: Only logs to console, returns `true`
- `cancelSchedule()`: Only logs to console, returns `true`
- `getUpcomingSchedules()`: Returns empty array
- `notifyCourseScheduled()`: Only logs to console

**Available Methods**:
```typescript
- createSchedule(options: ScheduleOptions): Date[]
- scheduleCourse(course: ScheduledCourse): boolean
- cancelSchedule(courseId: string): boolean
- getUpcomingSchedules(): ScheduledCourse[]
- notifyCourseScheduled(courseTitle: string, scheduledFor: Date, courseId: string): Promise<void>
```

#### 2. **AdminAddCourseWizard Component** (`src/components/AdminAddCourseWizard.tsx`)
- **Primary Location**: Main course creation wizard
- **Scheduling Flow**: Step 3 → "Schedule" button → Schedule popup modal
- **Key Function**: `handleScheduleCourse()`

**Scheduling Process**:
1. Validates course title and videos
2. Validates date and time selection
3. Combines date and time into ISO string
4. Uploads cover photo (if provided)
5. Creates course record with:
   - `is_scheduled: true`
   - `status: 'scheduled'`
   - `scheduled_for: <ISO datetime>`
6. Creates lessons for each video with:
   - `is_scheduled: true`
   - `status: 'scheduled'`
   - `scheduled_for: <ISO datetime>`
7. Calls `CourseScheduler.notifyCourseScheduled()` (currently placeholder)
8. Redirects to `/admin/courses`

#### 3. **AddCourse Component** (`src/components/AddCourse.tsx`)
- **Alternative Location**: Another course creation interface
- **Key Function**: `onScheduleCourse()`
- **Similar Flow**: Creates course with scheduled status

## Database Schema

### Courses Table Fields
Based on code analysis, the `courses` table includes:
- `id` (UUID, Primary Key)
- `title` (TEXT)
- `description` (TEXT)
- `level` (TEXT)
- `category` (TEXT)
- `access_type` ('free' | 'membership')
- `cover_photo_url` (TEXT, nullable)
- `is_scheduled` (BOOLEAN)
- `status` (TEXT) - Values: 'scheduled', 'published', etc.
- `scheduled_for` (TIMESTAMP WITH TIME ZONE, nullable)
- `created_by` (UUID, Foreign Key to profiles)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

### Lessons Table Fields
The `lessons` table (used in AdminAddCourseWizard) includes:
- `id` (UUID, Primary Key)
- `course_id` (UUID, Foreign Key)
- `title` (TEXT)
- `video_url` (TEXT)
- `duration` (TEXT)
- `order_index` (INTEGER)
- `is_scheduled` (BOOLEAN)
- `status` (TEXT) - Values: 'scheduled', etc.
- `scheduled_for` (TIMESTAMP WITH TIME ZONE, nullable)

**Note**: There's also a `course_videos` table used in AddCourse component, which may be a different structure.

## User Interface

### Schedule Popup Modal
Located in `AdminAddCourseWizard.tsx` (lines 1068-1135):
- **Trigger**: "Schedule" button in Step 3 (Resources step)
- **Fields**:
  - Date picker (minimum date: today)
  - Time picker
- **Validation**:
  - Requires both date and time
  - Requires course title
  - Requires at least one video
- **Actions**:
  - Cancel (closes modal)
  - Schedule Course (triggers `handleScheduleCourse`)

### Course List Display
**AdminCourses Component** (`src/components/AdminCourses.tsx`):
- ⚠️ **Issue**: Does NOT display scheduled status or scheduled date
- Only shows: title, description, level, access type, duration, created date
- No visual indicator for scheduled courses
- No filtering by scheduled status

## Current Limitations & Issues

### 1. **Incomplete Implementation**
- `CourseScheduler` methods are placeholders
- No actual scheduling logic implemented
- No automatic activation when scheduled time arrives

### 2. **No Scheduled Course Activation**
- ❌ **Missing**: Background job or cron to activate scheduled courses
- ❌ **Missing**: Logic to change status from 'scheduled' to 'published' when time arrives
- ❌ **Missing**: Automatic lesson activation

### 3. **No Scheduled Course Management**
- ❌ **Missing**: View upcoming scheduled courses
- ❌ **Missing**: Cancel scheduled courses
- ❌ **Missing**: Edit scheduled course time
- ❌ **Missing**: Display scheduled date/time in course list

### 4. **Notification System**
- `notifyCourseScheduled()` only logs to console
- No actual notifications sent to users
- No email/push notification integration

### 5. **Data Inconsistency**
- Uses both `lessons` table (AdminAddCourseWizard) and `course_videos` table (AddCourse)
- Unclear which is the canonical source

### 6. **No Scheduled Course Visibility**
- Scheduled courses are created but not easily identifiable in the UI
- No filter or badge to show scheduled status
- No countdown or "scheduled for" display

## Workflow Analysis

### Creating a Scheduled Course

```
1. Admin navigates to Add Course Wizard
2. Fills in course details (Step 1)
3. Adds videos (Step 2)
4. Adds resources and cover photo (Step 3)
5. Clicks "Schedule" button
6. Schedule popup appears
7. Selects date and time
8. Clicks "Schedule Course"
9. Course created with is_scheduled=true, status='scheduled'
10. Lessons created with is_scheduled=true, status='scheduled'
11. Notification logged (placeholder)
12. Redirected to course list
```

### What Happens After Scheduling?
**Nothing automatically happens.** The course remains in 'scheduled' status indefinitely until manually changed.

## Recommendations

### High Priority

1. **Implement Scheduled Course Activation**
   - Create a background job/cron to check for courses where `scheduled_for <= NOW()`
   - Update course status from 'scheduled' to 'published'
   - Update lesson status from 'scheduled' to 'published'
   - Set `is_scheduled = false`

2. **Add Scheduled Course Display**
   - Show scheduled badge in AdminCourses list
   - Display scheduled date/time
   - Add filter for scheduled courses
   - Show countdown or "Scheduled for: [date]" text

3. **Implement CourseScheduler Methods**
   - `getUpcomingSchedules()`: Query database for scheduled courses
   - `cancelSchedule()`: Update course and lessons to cancel scheduled status
   - `notifyCourseScheduled()`: Integrate with notification service

### Medium Priority

4. **Scheduled Course Management UI**
   - Add "Scheduled Courses" section in admin dashboard
   - Allow editing scheduled time
   - Allow canceling scheduled courses
   - Show scheduled course calendar view

5. **Notification Integration**
   - Send email notifications when course is scheduled
   - Send notifications when scheduled course goes live
   - Allow users to subscribe to course notifications

6. **Data Consistency**
   - Clarify relationship between `lessons` and `course_videos` tables
   - Standardize on one table or document the difference

### Low Priority

7. **Enhanced Scheduling Features**
   - Recurring schedules (using `createSchedule()` method)
   - Multiple time slots per course
   - Timezone support
   - Schedule templates

## Code Locations

### Key Files
- `src/utils/courseScheduler.ts` - Core scheduler utility
- `src/components/AdminAddCourseWizard.tsx` - Main scheduling UI (lines 323-429, 1068-1135)
- `src/components/AddCourse.tsx` - Alternative scheduling UI (lines 196-259)
- `src/components/AdminCourses.tsx` - Course list (missing scheduled display)
- `src/utils/notificationService.ts` - Notification service (basic implementation)

### Database Tables
- `courses` - Main course table
- `lessons` - Lessons table (used by AdminAddCourseWizard)
- `course_videos` - Course videos table (used by AddCourse)

## Testing Recommendations

1. **Test Scheduled Course Creation**
   - Verify course is created with correct scheduled fields
   - Verify lessons are created with scheduled status
   - Verify date/time validation

2. **Test Scheduled Course Activation** (when implemented)
   - Verify courses activate at scheduled time
   - Verify status changes correctly
   - Verify lessons activate with course

3. **Test Scheduled Course Management** (when implemented)
   - Verify canceling scheduled courses
   - Verify editing scheduled time
   - Verify viewing upcoming schedules

## Conclusion

The Course Scheduling function has a **basic UI implementation** for creating scheduled courses, but lacks:
- Automatic activation mechanism
- Management interface
- Complete utility implementation
- User visibility

The foundation is in place, but significant development is needed to make it fully functional.

