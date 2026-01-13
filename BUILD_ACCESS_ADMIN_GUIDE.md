# 🏗️ B.U.I.L.D Access - Admin Implementation Guide

**Last Updated:** January 13, 2026  
**Status:** 📋 Planning Complete - Ready for Implementation  
**Feature Type:** Admin Tool

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Feature Requirements](#feature-requirements)
3. [Implementation Plan](#implementation-plan)
4. [Email Specifications](#email-specifications)
5. [Technical Implementation Details](#technical-implementation-details)
6. [File Structure](#file-structure)
7. [Database Schema](#database-schema)
8. [API Routes](#api-routes)
9. [Testing & Verification](#testing--verification)
10. [Troubleshooting](#troubleshooting)
11. [Future Enhancements](#future-enhancements)

---

## 🎯 OVERVIEW

### **What This Feature Does**

The **B.U.I.L.D Access** admin tool allows administrators to grant comprehensive access to the B.U.I.L.D COMMUNITY bundle by entering a user's email address. This feature:

- ✅ Grants access to **5 specific courses** (by title matching)
- ✅ Grants access to **ALL live classes**
- ✅ Sends **2 automated emails** to the user:
  1. **BUILD COMMUNITY Access Email** - Comprehensive access details
  2. **Career Path Discovery Email** - Invitation to career discovery

### **Key Differences from Manual Add to Library**

| Feature | Manual Add to Library | B.U.I.L.D Access |
|---------|----------------------|------------------|
| **Product Selection** | Admin selects individual course/path | Pre-defined bundle (5 courses + live classes) |
| **Email Input** | Required | Required |
| **Courses Granted** | One at a time | 5 courses + all live classes |
| **Emails Sent** | 1 (purchase access) | 2 (access + career discovery) |
| **Use Case** | Grant individual access | Grant full BUILD COMMUNITY bundle |

---

## 📋 FEATURE REQUIREMENTS

### **User Story**

> "As an admin, I want to grant B.U.I.L.D COMMUNITY access to users by entering their email address, so they receive full access to the BUILD bundle (5 courses + all live classes) and receive both access and career discovery emails automatically."

### **Functional Requirements**

1. **Admin Home Integration**
   - Add "B.U.I.L.D Access" button on admin dashboard
   - Button should match existing admin tool styling
   - Route to dedicated admin page

2. **Admin Page Features**
   - Single email input field
   - Email validation
   - User lookup (existing user or guest)
   - Display bundle contents (5 courses + live classes)
   - Grant access button
   - Success/error feedback
   - Loading states

3. **Access Granting**
   - Grant access to 5 courses (by title matching):
     1. FREELANCING - THE UNTAPPED MARKET
     2. INFORMATION MARKETING: THE INFINITE CASH LOOP
     3. YOUTUBE MONETIZATION: From Setup To Monetization
     4. EARN 500K SIDE INCOME SELLING EBOOKS
     5. CPA MARKETING BLUEPRINT: TKEA RESELLERS (already free)
   - Grant access to ALL live classes (set live class access flag)
   - Create purchase records for each course
   - Support both existing users and guest users

4. **Email Sending**
   - Send Email 1: BUILD COMMUNITY Access Email
   - Send Email 2: Career Path Discovery Email
   - Both emails sent automatically after access granted
   - Handle email failures gracefully (log but don't block success)

5. **Authorization**
   - Admin-only access (same as Manual Add to Library)
   - Protected route

---

## 🚀 IMPLEMENTATION PLAN

### **Phase 1: Component Structure** (1 hour)

**Tasks:**
- [ ] Create `src/components/BuildAccess.tsx` component
- [ ] Set up basic layout (similar to ManualAddToLibrary)
- [ ] Add admin check
- [ ] Add navigation/back button
- [ ] Add header with title and description

**Files to Create:**
- `src/components/BuildAccess.tsx`

**Files to Modify:**
- `src/App.tsx` - Add route
- `src/components/AdminDashboard.tsx` - Add button

---

### **Phase 2: Email Input & User Lookup** (1 hour)

**Tasks:**
- [ ] Add email input field
- [ ] Add email validation
- [ ] Implement user lookup function (reuse from ManualAddToLibrary)
- [ ] Display user info (existing user or guest)
- [ ] Handle user not found (guest user)

**Code Pattern:**
```typescript
// Reuse lookup logic from ManualAddToLibrary.tsx
const lookupUserByEmail = async (emailAddress: string) => {
  // Check profiles table
  // Set searchedUser or setIsGuestUser(true)
};
```

---

### **Phase 3: Bundle Display** (30 minutes)

**Tasks:**
- [ ] Display bundle contents section
- [ ] List all 5 courses with titles
- [ ] Show "All Live Classes" access
- [ ] Add visual styling (cards/list)
- [ ] Show bundle is pre-defined (not selectable)

**UI Structure:**
```
┌─────────────────────────────────────┐
│ 🎯 B.U.I.L.D COMMUNITY BUNDLE       │
│                                     │
│ 📚 Courses Included:               │
│   1. FREELANCING - THE UNTAPPED... │
│   2. INFORMATION MARKETING: THE... │
│   3. YOUTUBE MONETIZATION...        │
│   4. EARN 500K SIDE INCOME...       │
│   5. CPA MARKETING BLUEPRINT...     │
│                                     │
│ 🎥 Live Classes:                    │
│   ✓ Access to ALL live classes     │
└─────────────────────────────────────┘
```

---

### **Phase 4: Course Lookup & Access Granting** (2 hours)

**Tasks:**
- [ ] Create function to find courses by title (ILIKE matching)
- [ ] Create function to grant course access (create purchase records)
- [ ] Create function to grant live class access (set flag/role)
- [ ] Handle duplicate purchases (skip if exists)
- [ ] Support guest users (buyer_email only)
- [ ] Support existing users (buyer_id + buyer_email)

**Course Title Matching:**
```typescript
const BUILD_COURSES = [
  'FREELANCING - THE UNTAPPED MARKET',
  'INFORMATION MARKETING: THE INFINITE CASH LOOP',
  'YOUTUBE MONETIZATION: From Setup To Monetization',
  'EARN 500K SIDE INCOME SELLING EBOOKS',
  'CPA MARKETING BLUEPRINT: TKEA RESELLERS'
];

// Find courses by title (case-insensitive)
const findCoursesByTitles = async (titles: string[]) => {
  const { data } = await supabase
    .from('courses')
    .select('id, title')
    .in('title', titles); // Or use ILIKE for partial matching
  
  return data || [];
};
```

**Access Granting Logic:**
```typescript
const grantBuildAccess = async (email: string, userId: string | null) => {
  // 1. Find courses by title
  const courses = await findCoursesByTitles(BUILD_COURSES);
  
  // 2. Create purchase records for each course
  for (const course of courses) {
    await createPurchaseRecord({
      product_id: course.id,
      product_type: 'course',
      buyer_id: userId,
      buyer_email: email,
      // ... other fields
    });
  }
  
  // 3. Grant live class access (set flag/role)
  await grantLiveClassAccess(userId, email);
  
  // 4. Send emails
  await sendBuildEmails(email, userName);
};
```

---

### **Phase 5: Email Service Integration** (2 hours)

**Tasks:**
- [ ] Create `sendBuildCommunityAccessEmail()` function in emailService
- [ ] Create `sendCareerPathDiscoveryEmail()` function in emailService
- [ ] Create email templates (HTML)
- [ ] Create API route for BUILD emails (or extend existing)
- [ ] Integrate email sending into grant flow
- [ ] Handle email errors gracefully

**Email Functions:**
```typescript
// In src/services/emailService.ts
export const emailService = {
  // ... existing functions
  
  async sendBuildCommunityAccessEmail(params: {
    name: string;
    email: string;
    purchaseDate: string;
    libraryLink: string;
  }): Promise<{ success: boolean; error?: string }> {
    // Implementation
  },
  
  async sendCareerPathDiscoveryEmail(params: {
    name: string;
    email: string;
    careerPathLink: string;
  }): Promise<{ success: boolean; error?: string }> {
    // Implementation
  }
};
```

**API Route:**
- Create `api/send-build-access-emails.js` (or extend existing email API)

---

### **Phase 6: Success & Error Handling** (1 hour)

**Tasks:**
- [ ] Add success message display
- [ ] Show courses granted count
- [ ] Show email sending status (both emails)
- [ ] Add error handling for each step
- [ ] Add loading states
- [ ] Add "Grant Another Access" button
- [ ] Add "Done" button (back to admin)

**Success Display:**
```
✅ Success! B.U.I.L.D Access granted to [email]

Courses Granted: 5
Live Classes: ✓ Access granted
Email 1: ✓ Sent
Email 2: ✓ Sent
```

---

### **Phase 7: Routing & Navigation** (30 minutes)

**Tasks:**
- [ ] Add route in `src/App.tsx`
- [ ] Add button in `src/components/AdminDashboard.tsx`
- [ ] Test navigation flow
- [ ] Ensure admin-only access

**Route:**
```typescript
<Route 
  path="/admin/build-access" 
  element={<ProtectedRoute><BuildAccess /></ProtectedRoute>} 
/>
```

**Admin Dashboard Button:**
```typescript
<button
  onClick={() => navigate('/admin/build-access')}
  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-left"
>
  <div className="bg-purple-100 rounded-lg p-2">
    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* BUILD icon */}
    </svg>
  </div>
  <div>
    <p className="font-medium text-gray-900">B.U.I.L.D Access</p>
    <p className="text-sm text-gray-600">Grant BUILD COMMUNITY bundle access</p>
  </div>
</button>
```

---

## 📧 EMAIL SPECIFICATIONS

### **Email 1: BUILD COMMUNITY Access Email**

#### **Email Details**

- **Subject:** `Welcome to B.U.I.L.D COMMUNITY - Your Access Details`
- **From:** `noreply@thekingezekielacademy.com` (or `RESEND_FROM_EMAIL`)
- **When Sent:** Immediately after admin grants BUILD access
- **Recipient:** User email address

#### **Visual Layout**

```
┌─────────────────────────────────────────────────┐
│  [Purple Gradient Header]                       │
│  ✅ Welcome to B.U.I.L.D COMMUNITY!            │
└─────────────────────────────────────────────────┘
│                                                  │
│  Hi [Customer Name],                            │
│                                                  │
│  Thank you for joining the B.U.I.L.D COMMUNITY! │
│  You now have lifetime access to all our        │
│  premium courses and live classes.              │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🎯 WHAT YOU NOW HAVE ACCESS TO:          │  │
│  │                                          │  │
│  │ 📚 COURSES (Access via Library):         │  │
│  │   1. FREELANCING - THE UNTAPPED MARKET   │  │
│  │   2. INFORMATION MARKETING: THE         │  │
│  │      INFINITE CASH LOOP                  │  │
│  │   3. YOUTUBE MONETIZATION: From Setup   │  │
│  │      To Monetization                     │  │
│  │   4. EARN 500K SIDE INCOME SELLING      │  │
│  │      EBOOKS                              │  │
│  │   5. CPA MARKETING BLUEPRINT: TKEA      │  │
│  │      RESELLERS (FREE)                    │  │
│  │                                          │  │
│  │   [View All Courses in Library] Button  │  │
│  │                                          │  │
│  │ ──────────────────────────────────────  │  │
│  │                                          │  │
│  │ 🎥 LIVE CLASSES:                         │  │
│  │   Access to ALL live classes - Join     │  │
│  │   scheduled sessions and learn in       │  │
│  │   real-time with other students.        │  │
│  │                                          │  │
│  │   [View Live Classes] Button            │  │
│  │                                          │  │
│  │ ──────────────────────────────────────  │  │
│  │                                          │  │
│  │ 💬 COMMUNITY ACCESS:                     │  │
│  │   B.U.I.L.D COMMUNITY:                  │  │
│  │   Join Telegram Community →             │  │
│  │                                          │  │
│  │   LIVE CLASS UPDATE CHANNEL:            │  │
│  │   Join Update Channel →                 │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [Sign In to Access Library] Button             │
│                                                  │
│  Purchase Date: [Formatted Date]                │
│                                                  │
│  ────────────────────────────────────────────  │
│                                                  │
│  Support: support@thekingezekielacademy.com    │
│  © [Year] King Ezekiel Academy                  │
└─────────────────────────────────────────────────┘
```

#### **Content Sections**

1. **Header** - Purple gradient (`#667eea` to `#764ba2`)
2. **Greeting** - Personalized with customer name
3. **Access Details Box** - Gray background, purple left border
   - Courses section (5 courses listed)
   - Live classes section
   - Community access section (Telegram links)
4. **Sign-In CTA** - Purple gradient button
5. **Purchase Date** - Formatted date
6. **Footer** - Support email and copyright

#### **Links Included**

- **Library:** `[APP_URL]/library`
- **Live Classes:** `[APP_URL]/live-classes`
- **Sign In:** `[APP_URL]/auth?redirect=/library`
- **Telegram Community:** `https://t.me/+H6nI8QbGy1E0NGI0`
- **Telegram Updates:** `https://t.me/LIVECLASSREMINDER`
- **Support:** `support@thekingezekielacademy.com`

#### **Dynamic Variables**

| Variable | Source | Example |
|----------|--------|---------|
| `name` | User profile name or email prefix | "John" or "john.doe" |
| `email` | User email | "john@example.com" |
| `purchaseDate` | Current date formatted | "January 15, 2026" |
| `libraryLink` | `[APP_URL]/library` | "https://app.thekingezekielacademy.com/library" |

---

### **Email 2: Career Path Discovery Email**

#### **Email Details**

- **Subject:** `🎯 Discover Your Career Path - Free Course Selection`
- **From:** `noreply@thekingezekielacademy.com` (or `RESEND_FROM_EMAIL`)
- **When Sent:** Immediately after Email 1 (same transaction)
- **Recipient:** User email address

#### **Visual Layout**

```
┌─────────────────────────────────────────────────┐
│  [Pink Gradient Header]                         │
│  🎯 Discover Your Career Path!                  │
└─────────────────────────────────────────────────┘
│                                                  │
│  Hi [Customer Name],                            │
│                                                  │
│  Congratulations on joining the B.U.I.L.D       │
│  COMMUNITY! 🎉                                  │
│                                                  │
│  As a bonus, we're giving you access to our     │
│  Career Path Discovery tool. This will help     │
│  you identify which skill path aligns best      │
│  with your natural strengths and interests.      │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 📋 WHAT TO DO:                           │  │
│  │                                          │  │
│  │   1. Complete the Career Path Discovery │  │
│  │      (takes 3 minutes)                  │  │
│  │   2. Get matched to your ideal skill    │  │
│  │      path                                │  │
│  │   3. Select a FREE course that aligns   │  │
│  │      with your path                      │  │
│  │   4. Course will be added to your       │  │
│  │      Library automatically              │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [Start Career Path Discovery] Button          │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 💡 This is completely FREE! The Career  │  │
│  │ Path Discovery will help you choose the │  │
│  │ best course to start with based on your  │  │
│  │ natural strengths and interests.         │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ────────────────────────────────────────────  │
│                                                  │
│  Support: support@thekingezekielacademy.com     │
│  © [Year] King Ezekiel Academy                  │
└─────────────────────────────────────────────────┘
```

#### **Content Sections**

1. **Header** - Pink gradient (`#f093fb` to `#f5576c`)
2. **Greeting & Introduction** - Congratulations message
3. **Instructions Box** - Gray background, pink left border (numbered steps)
4. **CTA Button** - Pink gradient button
5. **Free Course Highlight Box** - Yellow background
6. **Footer** - Support email and copyright

#### **Links Included**

- **Career Path:** `[APP_URL]/career-path`
- **Support:** `support@thekingezekielacademy.com`

#### **Dynamic Variables**

| Variable | Source | Example |
|----------|--------|---------|
| `name` | User profile name or email prefix | "John" or "john.doe" |
| `email` | User email | "john@example.com" |
| `careerPathLink` | `[APP_URL]/career-path` | "https://app.thekingezekielacademy.com/career-path" |

---

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### **Component Structure**

```typescript
// src/components/BuildAccess.tsx

interface BuildAccessProps {}

const BuildAccess: React.FC<BuildAccessProps> = () => {
  // State
  const [email, setEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState<Profile | null>(null);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [coursesGranted, setCoursesGranted] = useState<string[]>([]);
  const [emailsSent, setEmailsSent] = useState({ email1: false, email2: false });

  // Functions
  const lookupUserByEmail = async (email: string) => { /* ... */ };
  const findCoursesByTitles = async (titles: string[]) => { /* ... */ };
  const grantBuildAccess = async () => { /* ... */ };
  const sendBuildEmails = async (email: string, name: string) => { /* ... */ };

  // Render
  return (/* ... */);
};
```

### **Course Title Matching**

```typescript
const BUILD_COURSE_TITLES = [
  'FREELANCING - THE UNTAPPED MARKET',
  'INFORMATION MARKETING: THE INFINITE CASH LOOP',
  'YOUTUBE MONETIZATION: From Setup To Monetization',
  'EARN 500K SIDE INCOME SELLING EBOOKS',
  'CPA MARKETING BLUEPRINT: TKEA RESELLERS'
];

const findCoursesByTitles = async (titles: string[]) => {
  // Option 1: Exact match (if titles are exact)
  const { data } = await supabase
    .from('courses')
    .select('id, title')
    .in('title', titles);
  
  // Option 2: Partial match (ILIKE) - more flexible
  const queries = titles.map(title => 
    supabase
      .from('courses')
      .select('id, title')
      .ilike('title', `%${title}%`)
  );
  
  const results = await Promise.all(queries);
  return results.flatMap(r => r.data || []);
};
```

### **Access Granting Logic**

```typescript
const grantBuildAccess = async () => {
  try {
    setGranting(true);
    setError('');
    
    const userEmail = email.toLowerCase().trim();
    const userId = searchedUser?.id || null;
    
    // 1. Find courses by title
    const courses = await findCoursesByTitles(BUILD_COURSE_TITLES);
    
    if (courses.length === 0) {
      throw new Error('No BUILD courses found. Please verify course titles.');
    }
    
    // 2. Create purchase records for each course
    const grantedCourses: string[] = [];
    
    for (const course of courses) {
      // Check for duplicate
      const hasDuplicate = await checkDuplicatePurchase(
        userId,
        userEmail,
        course.id,
        'course'
      );
      
      if (!hasDuplicate) {
        await createPurchaseRecord({
          product_id: course.id,
          product_type: 'course',
          buyer_id: userId,
          buyer_email: userEmail,
          amount_paid: 1, // Minimum (1 kobo)
          purchase_price: 0, // Free grant
          payment_status: 'success',
          payment_reference: `BUILD_ADMIN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          access_granted: true,
          access_granted_at: new Date().toISOString(),
          access_token: generateAccessToken(),
        });
        
        grantedCourses.push(course.title);
      }
    }
    
    // 3. Grant live class access
    await grantLiveClassAccess(userId, userEmail);
    
    // 4. Send emails
    setSendingEmails(true);
    await sendBuildEmails(userEmail, searchedUser?.name || 'Valued Student');
    setSendingEmails(false);
    
    setCoursesGranted(grantedCourses);
    setSuccess(true);
  } catch (err: any) {
    setError(err.message || 'Failed to grant BUILD access');
  } finally {
    setGranting(false);
    setSendingEmails(false);
  }
};
```

### **Live Class Access Granting**

**Note:** This depends on how live class access is stored in your system. Common approaches:

1. **User Role/Flag:**
```typescript
const grantLiveClassAccess = async (userId: string | null, email: string) => {
  if (userId) {
    // Update user profile with live class access flag
    await supabase
      .from('profiles')
      .update({ has_live_class_access: true })
      .eq('id', userId);
  } else {
    // For guest users, store in a separate table or metadata
    // This depends on your system architecture
  }
};
```

2. **Subscription/Purchase Record:**
```typescript
const grantLiveClassAccess = async (userId: string | null, email: string) => {
  // Create a special purchase record for "all live classes"
  await supabase
    .from('product_purchases')
    .insert({
      product_id: 'ALL_LIVE_CLASSES', // Special ID or use a flag
      product_type: 'live_class_bundle',
      buyer_id: userId,
      buyer_email: email,
      // ... other fields
    });
};
```

**Action Required:** Determine how live class access is stored in your system.

---

## 📁 FILE STRUCTURE

### **Files to Create**

1. **Component:**
   - `src/components/BuildAccess.tsx` - Main component

2. **API Routes:**
   - `api/send-build-access-emails.js` - Email sending API (or extend existing)

3. **Email Service (extend):**
   - Add functions to `src/services/emailService.ts`

### **Files to Modify**

1. **Routing:**
   - `src/App.tsx` - Add route for `/admin/build-access`

2. **Admin Dashboard:**
   - `src/components/AdminDashboard.tsx` - Add "B.U.I.L.D Access" button

3. **Email Service:**
   - `src/services/emailService.ts` - Add BUILD email functions

---

## 🗄️ DATABASE SCHEMA

### **Tables Used**

1. **`profiles`** - User lookup
   - `id` (UUID)
   - `email` (TEXT)
   - `name` (TEXT)
   - `has_live_class_access` (BOOLEAN) - *May need to add*

2. **`courses`** - Course lookup
   - `id` (UUID)
   - `title` (TEXT) - Used for matching
   - `status` (TEXT) - Filter by 'published'

3. **`product_purchases`** - Purchase records
   - `id` (UUID)
   - `buyer_id` (UUID, nullable)
   - `buyer_email` (TEXT, nullable)
   - `product_id` (UUID)
   - `product_type` (TEXT) - 'course' or 'live_class_bundle'
   - `amount_paid` (DECIMAL)
   - `purchase_price` (DECIMAL)
   - `payment_status` (TEXT)
   - `access_granted` (BOOLEAN)
   - `access_granted_at` (TIMESTAMP)
   - `payment_reference` (TEXT)
   - `access_token` (TEXT)

### **Potential Migrations**

```sql
-- Add live class access flag to profiles (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_live_class_access BOOLEAN DEFAULT FALSE;

-- Create index for faster course title lookups
CREATE INDEX IF NOT EXISTS idx_courses_title_ilike 
ON courses(title text_pattern_ops);

-- Create index for buyer_email lookups
CREATE INDEX IF NOT EXISTS idx_product_purchases_buyer_email 
ON product_purchases(buyer_email) 
WHERE buyer_email IS NOT NULL;
```

---

## 🔌 API ROUTES

### **Email Sending API**

**Option 1: Extend Existing API**
- Extend `api/send-purchase-access-email.js` to handle BUILD emails

**Option 2: Create New API**
- Create `api/send-build-access-emails.js`

**API Structure:**
```javascript
// api/send-build-access-emails.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { emailType, name, email, purchaseDate, libraryLink, careerPathLink } = req.body;

  // Validate
  if (!emailType || !email) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Get Resend API key
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@thekingezekielacademy.com';

  // Generate HTML based on emailType
  let html, subject;
  if (emailType === 'build_access') {
    html = generateBuildAccessEmailTemplate({ name, email, purchaseDate, libraryLink });
    subject = 'Welcome to B.U.I.L.D COMMUNITY - Your Access Details';
  } else if (emailType === 'career_discovery') {
    html = generateCareerDiscoveryEmailTemplate({ name, email, careerPathLink });
    subject = '🎯 Discover Your Career Path - Free Course Selection';
  }

  // Send via Resend
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject,
      html,
    }),
  });

  // Handle response
  // ...
}
```

---

## 🧪 TESTING & VERIFICATION

### **Test Cases**

#### **1. User Lookup**
- [ ] Existing user found correctly
- [ ] Guest user handled correctly
- [ ] Invalid email format rejected
- [ ] Empty email rejected

#### **2. Course Matching**
- [ ] All 5 courses found by title
- [ ] Partial title matches work (if using ILIKE)
- [ ] Handles missing courses gracefully
- [ ] Handles duplicate course titles

#### **3. Access Granting**
- [ ] Purchase records created for all courses
- [ ] Duplicate purchases skipped (no errors)
- [ ] Guest user purchases use buyer_email only
- [ ] Existing user purchases use buyer_id + buyer_email
- [ ] Live class access granted

#### **4. Email Sending**
- [ ] Email 1 sent successfully
- [ ] Email 2 sent successfully
- [ ] Email failures logged but don't block success
- [ ] Email content correct (all links, formatting)

#### **5. UI/UX**
- [ ] Loading states shown during operations
- [ ] Success message displays correctly
- [ ] Error messages clear and actionable
- [ ] Bundle contents displayed correctly
- [ ] Navigation works (back button, done button)

### **Manual Testing Checklist**

1. **Grant Access to Existing User:**
   - [ ] Enter existing user email
   - [ ] Verify user found
   - [ ] Click "Grant BUILD Access"
   - [ ] Verify success message
   - [ ] Check purchase records in database
   - [ ] Verify emails received

2. **Grant Access to Guest User:**
   - [ ] Enter new email (not in database)
   - [ ] Verify "Guest User" displayed
   - [ ] Click "Grant BUILD Access"
   - [ ] Verify success message
   - [ ] Check purchase records (buyer_email only)
   - [ ] Verify emails received

3. **Error Handling:**
   - [ ] Test with invalid email format
   - [ ] Test with missing courses (if any)
   - [ ] Test with email API failure (mock)
   - [ ] Verify errors displayed correctly

### **Database Verification**

```sql
-- Check purchase records created
SELECT 
  pp.id,
  pp.buyer_email,
  pp.product_id,
  c.title as course_title,
  pp.access_granted,
  pp.created_at
FROM product_purchases pp
JOIN courses c ON pp.product_id = c.id
WHERE pp.buyer_email = 'test@example.com'
  AND pp.payment_reference LIKE 'BUILD_ADMIN_%'
ORDER BY pp.created_at DESC;

-- Check live class access
SELECT 
  id,
  email,
  has_live_class_access
FROM profiles
WHERE email = 'test@example.com';
```

---

## 🔍 TROUBLESHOOTING

### **Common Issues**

#### **Issue 1: Courses Not Found**

**Symptoms:**
- Error: "No BUILD courses found"
- Courses not matching by title

**Solutions:**
- Verify course titles in database match exactly
- Use ILIKE for partial matching
- Check course status (should be 'published')
- Add logging to see which titles are being searched

#### **Issue 2: Email Not Sending**

**Symptoms:**
- Access granted but emails not received
- Email API errors in logs

**Solutions:**
- Check Resend API key configured
- Verify `RESEND_FROM_EMAIL` set
- Check email API logs
- Verify email addresses valid
- Check Resend API rate limits

#### **Issue 3: Live Class Access Not Granted**

**Symptoms:**
- Courses granted but live classes not accessible

**Solutions:**
- Verify live class access mechanism
- Check if flag/role set correctly
- Verify purchase record created (if using purchase-based access)
- Check user profile updated (if using flag-based access)

#### **Issue 4: Duplicate Purchases**

**Symptoms:**
- Error when granting access to user who already has courses

**Solutions:**
- Implement duplicate check before creating purchase
- Skip existing purchases (don't error)
- Show warning but allow proceeding

---

## 🚀 FUTURE ENHANCEMENTS

### **Potential Improvements**

1. **Bulk Granting**
   - Allow granting access to multiple emails at once
   - CSV upload for bulk operations

2. **Access Revocation**
   - Ability to revoke BUILD access
   - Remove purchase records
   - Send revocation email

3. **Access History**
   - Track who granted BUILD access
   - Show grant history per user
   - Admin audit log

4. **Custom Bundle Configuration**
   - Allow admins to configure which courses are in bundle
   - UI for managing bundle contents

5. **Email Customization**
   - Allow admins to customize email content
   - Template editor

6. **Analytics**
   - Track BUILD access grants
   - Show statistics (grants per day/week/month)
   - Conversion tracking (career path completion)

---

## ✅ QUICK REFERENCE

### **Key Functions**

- `lookupUserByEmail()` - Find user by email
- `findCoursesByTitles()` - Find courses by title matching
- `grantBuildAccess()` - Main access granting function
- `grantLiveClassAccess()` - Grant live class access
- `sendBuildEmails()` - Send both emails

### **Key Constants**

- `BUILD_COURSE_TITLES` - Array of 5 course titles
- `TELEGRAM_COMMUNITY_LINK` - `https://t.me/+H6nI8QbGy1E0NGI0`
- `TELEGRAM_UPDATES_LINK` - `https://t.me/LIVECLASSREMINDER`

### **Key Routes**

- Admin Page: `/admin/build-access`
- Library: `/library`
- Live Classes: `/live-classes`
- Career Path: `/career-path`

### **Key Files**

- Component: `src/components/BuildAccess.tsx`
- Email Service: `src/services/emailService.ts`
- API Route: `api/send-build-access-emails.js`
- Admin Dashboard: `src/components/AdminDashboard.tsx`

---

## 📝 IMPLEMENTATION CHECKLIST

### **Pre-Implementation**

- [ ] Review existing Manual Add to Library implementation
- [ ] Verify course titles in database
- [ ] Determine live class access mechanism
- [ ] Set up Resend API (if not already configured)
- [ ] Review email templates

### **Implementation**

- [ ] Create BuildAccess component
- [ ] Add route and admin dashboard button
- [ ] Implement user lookup
- [ ] Implement course matching
- [ ] Implement access granting
- [ ] Implement live class access
- [ ] Create email templates
- [ ] Create email API route
- [ ] Add success/error handling
- [ ] Add loading states

### **Testing**

- [ ] Test with existing user
- [ ] Test with guest user
- [ ] Test email sending
- [ ] Test error cases
- [ ] Verify database records
- [ ] Verify emails received

### **Deployment**

- [ ] Code review
- [ ] Deploy to staging
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor for errors

---

**Document Version:** 1.0  
**Last Updated:** January 13, 2026  
**Maintained By:** Development Team  
**Status:** 📋 Ready for Implementation
