# 🛤️ Add Learning Path Wizard - Implementation Plan

## 📋 **OVERVIEW**

Create a multi-step wizard component (`AddLearningPathWizard.tsx`) that allows admins to create learning paths by:
1. Entering basic information
2. Setting pricing and access
3. Selecting and ordering courses
4. Previewing and publishing

---

## 🗄️ **DATABASE SCHEMA UNDERSTANDING**

### **learning_paths Table:**
- `id` (UUID, Primary Key)
- `title` (TEXT, Required)
- `description` (TEXT)
- `cover_photo_url` (TEXT) - Cover image URL
- `gradient` (TEXT) - CSS gradient class (optional)
- `category` (TEXT, Default: 'business-entrepreneurship')
- `level` (TEXT, Default: 'beginner') - Values: 'beginner', 'intermediate', 'advanced', 'expert', 'mastery'
- `instructor` (TEXT) - Primary instructor name
- `duration` (TEXT) - e.g., '30 days', '4 weeks'
- `estimated_course_count` (INTEGER, Default: 0) - Auto-updated by trigger
- `purchase_price` (DECIMAL(10,2), Default: 0) - Price in NGN
- `access_type` (TEXT, Default: 'purchase') - Values: 'free', 'purchase'
- `status` (TEXT, Default: 'draft') - Values: 'draft', 'published', 'archived'
- `created_by` (UUID, References profiles.id)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### **learning_path_courses Table (Junction):**
- `id` (UUID, Primary Key)
- `learning_path_id` (UUID, References learning_paths.id)
- `course_id` (UUID, References courses.id)
- `order_index` (INTEGER) - Order of course in path (0-based)
- `is_required` (BOOLEAN, Default: true) - Required vs optional course
- `created_at` (TIMESTAMP)
- UNIQUE constraint: (learning_path_id, course_id) - Prevents duplicate courses

---

## 🎯 **COMPONENT STRUCTURE**

### **File:** `src/components/AddLearningPathWizard.tsx`

### **State Management:**
```typescript
interface LearningPathData {
  // Step 1: Basic Info
  title: string;
  description: string;
  coverPhoto?: File;
  gradient?: string;
  category: string;
  level: string;
  instructor?: string;
  duration?: string;
  
  // Step 2: Pricing & Access
  purchase_price: number;
  access_type: 'free' | 'purchase';
  
  // Step 3: Course Selection
  selectedCourses: SelectedCourse[];
  
  // Step 4: Status
  status: 'draft' | 'published';
}

interface SelectedCourse {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  cover_photo_url?: string;
  level?: string;
  order_index: number;
  is_required: boolean;
}
```

---

## 📝 **STEP-BY-STEP IMPLEMENTATION PLAN**

### **STEP 1: Set Up Component Foundation**

1. **Create Component Structure**
   - Import React, hooks (useState, useEffect, useRef, useCallback)
   - Import navigation (useNavigate)
   - Import Supabase client
   - Import auth context
   - Set up TypeScript interfaces

2. **Initialize State**
   - Wizard step state (1-4)
   - Loading state
   - Error/success messages
   - Learning path data state
   - Course selection state
   - Drag and drop state

3. **Admin Access Check**
   - Check user role
   - Redirect if not admin
   - Show loading state

---

### **STEP 2: Implement Step 1 - Basic Information**

**Fields to Include:**
- ✅ Title (required, text input)
- ✅ Description (textarea, rich text editor optional)
- ✅ Cover Photo (file upload with drag & drop)
  - Accept: image/* (jpg, png, webp)
  - Max size: 5MB
  - Preview image
  - Remove/replace functionality
- ✅ Gradient (optional, text input or dropdown)
  - Predefined gradients or custom CSS class
- ✅ Category (dropdown/select)
  - Options: Based on existing categories in courses
  - Default: 'business-entrepreneurship'
- ✅ Level (dropdown)
  - Options: 'beginner', 'intermediate', 'advanced', 'expert', 'mastery'
  - Default: 'beginner'
- ✅ Instructor (text input, optional)
- ✅ Duration (text input, optional)
  - Examples: '30 days', '4 weeks', '2 months'

**Validation:**
- Title is required
- Description should be at least 50 characters (optional validation)
- Cover photo must be valid image file

**UI Features:**
- Progress indicator (Step 1 of 4)
- Navigation buttons (Next, Cancel)
- Image preview for cover photo
- Character count for description

---

### **STEP 3: Implement Step 2 - Pricing & Access**

**Fields to Include:**
- ✅ Access Type (radio buttons or toggle)
  - Options: 'free' or 'purchase'
  - Default: 'purchase'
- ✅ Purchase Price (number input)
  - Only shown if access_type = 'purchase'
  - Currency: NGN (₦)
  - Min: 0
  - Default: 0
  - Format: Normalize to naira (handle kobo if needed)

**Validation:**
- If access_type = 'purchase', price must be > 0
- Price must be valid number

**UI Features:**
- Conditional field display (price only for purchase)
- Currency formatting
- Price preview
- Help text explaining free vs purchase

---

### **STEP 4: Implement Step 3 - Course Selection**

**This is the MOST COMPLEX step**

**Features to Build:**

1. **Fetch Available Courses**
   - Query `courses` table
   - Filter: Only published courses
   - Select: id, title, description, cover_photo_url, level, category
   - Order by: created_at (or allow sorting)

2. **Course Search & Filter**
   - Search bar (search by title/description)
   - Filter by category
   - Filter by level
   - Clear filters button

3. **Course Selection Interface**
   - Display courses in grid/list view
   - Show course card with:
     - Cover image
     - Title
     - Description (truncated)
     - Level badge
     - Category badge
     - "Add to Path" button
   - Show which courses are already selected

4. **Selected Courses List**
   - Show selected courses in order
   - Display with drag handles
   - Show order number (1, 2, 3...)
   - Toggle required/optional per course
   - Remove course button

5. **Drag & Drop Functionality**
   - Drag courses to reorder
   - Visual feedback during drag
   - Update order_index automatically
   - Prevent duplicate courses (UNIQUE constraint)

6. **Course Management Functions**
   - Add course to path
   - Remove course from path
   - Reorder courses (drag & drop or up/down arrows)
   - Toggle required/optional
   - Validate at least 1 course selected

**Validation:**
- Must select at least 1 course
- No duplicate courses (enforced by UNIQUE constraint)

---

### **STEP 5: Implement Step 4 - Preview & Publish**

**Preview Display:**
- Show all learning path information
- Display selected courses in order
- Show cover photo preview
- Display pricing information
- Show estimated course count

**Actions:**
- Publish (status = 'published')
- Save as Draft (status = 'draft')
- Go back to edit

**Preview Sections:**
1. Basic Info Preview
2. Pricing & Access Summary
3. Course List Preview (ordered)
4. Estimated Duration/Count

---

### **STEP 6: Implement Save/Create Function**

**Function Flow:**

1. **Validate All Steps**
   - Title required
   - At least 1 course selected
   - Price validation if purchase type

2. **Upload Cover Photo** (if provided)
   - Upload to Supabase Storage
   - Get public URL
   - Handle errors

3. **Create Learning Path Record**
   ```typescript
   const learningPathData = {
     title: pathData.title,
     description: pathData.description,
     cover_photo_url: coverPhotoUrl || null,
     gradient: pathData.gradient || null,
     category: pathData.category,
     level: pathData.level,
     instructor: pathData.instructor || null,
     duration: pathData.duration || null,
     purchase_price: pathData.purchase_price || 0,
     access_type: pathData.access_type,
     status: pathData.status,
     created_by: user.id,
     estimated_course_count: pathData.selectedCourses.length
   };
   ```

4. **Insert to learning_paths table**
   - Use Supabase insert
   - Get created path ID

5. **Create Course Associations**
   - Loop through selectedCourses
   - Insert into learning_path_courses table:
     ```typescript
     const courseAssociations = selectedCourses.map((course, index) => ({
       learning_path_id: createdPathId,
       course_id: course.course_id,
       order_index: index,
       is_required: course.is_required
     }));
     ```
   - Bulk insert or individual inserts with error handling

6. **Error Handling**
   - Rollback if course associations fail
   - Show user-friendly error messages
   - Log errors for debugging

7. **Success Handling**
   - Show success message
   - Navigate to learning paths list
   - Or navigate to edit page for the new path

---

## 🎨 **UI/UX FEATURES**

### **Design Patterns (Based on AdminAddCourseWizard):**

1. **Multi-Step Wizard Navigation**
   - Progress bar showing current step
   - Step indicators (1, 2, 3, 4)
   - Back/Next buttons
   - Save as Draft option (always available)

2. **Form Validation**
   - Real-time validation
   - Error messages below fields
   - Disable Next if validation fails
   - Summary of errors on final step

3. **Image Upload**
   - Drag & drop zone
   - File browser button
   - Image preview
   - Remove/replace functionality
   - Loading state during upload

4. **Drag & Drop Course Ordering**
   - Visual drag handles
   - Hover effects
   - Drop indicators
   - Smooth animations

5. **Course Selection UI**
   - Grid or list view toggle
   - Course cards with images
   - Checkmark for selected courses
   - Filter chips/badges
   - Empty state messages

6. **Responsive Design**
   - Mobile-friendly
   - Tablet optimized
   - Desktop full-featured

---

## 🔧 **TECHNICAL IMPLEMENTATION DETAILS**

### **Dependencies Needed:**
- React hooks (already in project)
- Supabase client (already configured)
- Image upload utilities (similar to course wizard)
- Drag & drop libraries (HTML5 drag API or react-beautiful-dnd - optional)

### **Helper Functions to Create:**

1. **`fetchAvailableCourses()`**
   - Query courses table
   - Filter by status = 'published'
   - Apply search/filter
   - Return course list

2. **`validateStep(step: number)`**
   - Validate current step's required fields
   - Return validation errors
   - Used before moving to next step

3. **`uploadCoverPhoto(file: File)`**
   - Upload to Supabase Storage bucket
   - Return public URL
   - Handle errors

4. **`normalizePrice(price: number)`**
   - Handle kobo/naira conversion
   - Return normalized price in naira

5. **`calculateEstimatedDuration(courses: Course[])`**
   - Sum up course durations
   - Return formatted duration string

6. **`handleDragStart()`, `handleDragOver()`, `handleDrop()`**
   - Drag & drop handlers for course reordering

---

## 📊 **DATA FLOW**

```
User Input → State Update → Validation → Step Navigation
                                          ↓
                          Step 4: Create Learning Path
                                          ↓
                    Upload Cover Photo → Get URL
                                          ↓
                    Insert learning_paths record
                                          ↓
                    Get learning_path_id
                                          ↓
                    Insert learning_path_courses records
                                          ↓
                    Success → Navigate to List/Edit
```

---

## ✅ **VALIDATION RULES**

### **Step 1 Validation:**
- Title: Required, min 3 characters, max 200 characters
- Description: Optional, but if provided min 50 characters
- Cover Photo: Valid image file, max 5MB
- Category: Must be valid category from dropdown
- Level: Must be valid level value

### **Step 2 Validation:**
- Access Type: Must be 'free' or 'purchase'
- Purchase Price: Required if access_type = 'purchase', must be > 0
- Price: Must be valid number, max 1,000,000 NGN

### **Step 3 Validation:**
- Selected Courses: Must have at least 1 course
- No duplicates: Enforced by database UNIQUE constraint
- Order: Must have valid order_index for each course

### **Step 4 Validation:**
- All previous steps must be valid
- Status: Must be 'draft' or 'published'

---

## 🎯 **COMPONENT FEATURES BREAKDOWN**

### **Step 1: Basic Information Form**
```
┌─────────────────────────────────────┐
│  Step 1 of 4: Basic Information    │
├─────────────────────────────────────┤
│  Title *                            │
│  [____________________________]     │
│                                     │
│  Description                        │
│  [____________________________]     │
│  [____________________________]     │
│                                     │
│  Cover Photo                        │
│  [Drag & Drop Zone]                 │
│  or [Browse Files]                  │
│                                     │
│  Gradient (Optional)                │
│  [____________________________]     │
│                                     │
│  Category *                         │
│  [Dropdown ▼]                       │
│                                     │
│  Level *                            │
│  [Dropdown ▼]                       │
│                                     │
│  Instructor                         │
│  [____________________________]     │
│                                     │
│  Duration                           │
│  [____________________________]     │
│                                     │
│  [Cancel]  [Next →]                 │
└─────────────────────────────────────┘
```

### **Step 2: Pricing & Access Form**
```
┌─────────────────────────────────────┐
│  Step 2 of 4: Pricing & Access     │
├─────────────────────────────────────┤
│  Access Type *                      │
│  ( ) Free                           │
│  (•) Purchase                       │
│                                     │
│  Purchase Price * (if purchase)     │
│  ₦ [___________________]            │
│                                     │
│  [← Back]  [Next →]                 │
└─────────────────────────────────────┘
```

### **Step 3: Course Selection**
```
┌─────────────────────────────────────┐
│  Step 3 of 4: Course Selection     │
├─────────────────────────────────────┤
│  Search: [___________________]      │
│  Filters: [Category ▼] [Level ▼]   │
│                                     │
│  Available Courses                  │
│  ┌────┐ ┌────┐ ┌────┐              │
│  │    │ │    │ │    │              │
│  │ C1 │ │ C2 │ │ C3 │              │
│  │    │ │    │ │    │              │
│  └────┘ └────┘ └────┘              │
│                                     │
│  Selected Courses (Drag to reorder) │
│  1. [☰] Course A [Required ✓] [×]  │
│  2. [☰] Course B [Required ✓] [×]  │
│                                     │
│  [← Back]  [Next →]                 │
└─────────────────────────────────────┘
```

### **Step 4: Preview & Publish**
```
┌─────────────────────────────────────┐
│  Step 4 of 4: Preview & Publish    │
├─────────────────────────────────────┤
│  Preview:                           │
│  • Title                            │
│  • Description                      │
│  • Cover Photo                      │
│  • Pricing                          │
│  • Courses (in order)               │
│                                     │
│  Status:                            │
│  ( ) Draft                          │
│  (•) Published                      │
│                                     │
│  [← Back]  [Save as Draft]          │
│              [Publish]               │
└─────────────────────────────────────┘
```

---

## 🔄 **EDGE CASES TO HANDLE**

1. **Cover Photo Upload Failure**
   - Allow continuing without cover photo
   - Show warning but don't block creation
   - Use placeholder image

2. **Course Deletion After Selection**
   - Handle course being deleted from database
   - Show warning if selected course no longer exists
   - Allow removal from selection

3. **Duplicate Course Selection**
   - Prevent duplicate selection in UI
   - Show error if somehow duplicate gets through
   - Database constraint will also prevent

4. **Empty Course List**
   - Show helpful message if no courses available
   - Link to create courses page

5. **Network Errors**
   - Retry logic for uploads
   - Show user-friendly error messages
   - Allow saving progress locally (optional)

6. **Validation Errors**
   - Show all errors at once
   - Highlight invalid fields
   - Prevent progression with errors

---

## 🎨 **STYLING APPROACH**

- Use Tailwind CSS (already in project)
- Match AdminAddCourseWizard styling
- Consistent color scheme (indigo/blue)
- Responsive grid layouts
- Smooth transitions between steps
- Loading states for async operations

---

## 📦 **FILES TO CREATE/MODIFY**

### **Create:**
1. `src/components/AddLearningPathWizard.tsx` - Main component
2. `src/utils/learningPathHelpers.ts` - Helper functions (optional)

### **Modify:**
1. `src/App.tsx` - Already has route (done ✅)

### **Reference:**
1. `src/components/AdminAddCourseWizard.tsx` - For patterns/structure
2. `src/components/LearningPathManagement.tsx` - For data structures

---

## 🚀 **IMPLEMENTATION ORDER**

1. **Phase 1: Foundation** (30 min)
   - Create component structure
   - Set up state management
   - Implement step navigation
   - Add admin check

2. **Phase 2: Step 1 - Basic Info** (1 hour)
   - Form fields
   - Image upload
   - Validation
   - UI styling

3. **Phase 3: Step 2 - Pricing** (30 min)
   - Access type toggle
   - Price input
   - Validation
   - Conditional display

4. **Phase 4: Step 3 - Course Selection** (2-3 hours)
   - Fetch courses
   - Search/filter UI
   - Course selection
   - Drag & drop ordering
   - Required/optional toggle

5. **Phase 5: Step 4 - Preview** (1 hour)
   - Preview display
   - Status selection
   - Final validation

6. **Phase 6: Save Function** (1 hour)
   - Upload cover photo
   - Create learning path
   - Create course associations
   - Error handling
   - Success flow

7. **Phase 7: Polish** (30 min)
   - Loading states
   - Error messages
   - Success notifications
   - Navigation flow

**Total Estimated Time: 6-8 hours**

---

## ✅ **SUCCESS CRITERIA**

1. ✅ Admin can create learning path through wizard
2. ✅ All fields save correctly to database
3. ✅ Courses can be selected and ordered
4. ✅ Cover photo uploads successfully
5. ✅ Validation prevents invalid submissions
6. ✅ Success message and navigation works
7. ✅ Created path appears in Learning Paths list
8. ✅ Course associations are correct
9. ✅ UI is responsive and user-friendly
10. ✅ Error handling is robust

---

## 📝 **NOTES**

- Follow existing patterns from AdminAddCourseWizard
- Use same Supabase client configuration
- Match UI/UX with other admin components
- Handle edge cases gracefully
- Test with real data before deploying
- Consider adding edit functionality next

---

## 🎯 **READY TO IMPLEMENT**

All planning is complete. The component can now be built following this detailed plan!
