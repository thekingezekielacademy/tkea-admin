# 🚀 Bulk Broadcast Enhancement Plan

## 📋 Overview
Transform the Bulk Broadcast feature into a powerful, category-based communication system with contact upload, smart categorization, and time-based segmentation.

---

## 🎯 NEW FEATURES

### 1. **Contact Upload System**

#### **SMS Contacts Upload**
- **File Upload:** CSV/Excel file upload
- **Supported Columns:**
  - `name` (optional)
  - `phone` (required)
  - `category` (optional - auto-assign if not provided)
  - `email` (optional - for cross-reference)
- **Validation:**
  - Phone number format validation
  - Duplicate detection
  - Invalid phone number filtering
- **Auto-Categorization:**
  - By upload date (default)
  - By phone number prefix (country/region)
  - By custom tags in CSV

#### **Email Contacts Upload**
- **File Upload:** CSV/Excel file upload
- **Supported Columns:**
  - `name` (optional)
  - `email` (required)
  - `phone` (optional - for cross-reference)
  - `category` (optional - auto-assign if not provided)
  - `created_at` (optional - for time-based categorization)
- **Validation:**
  - Email format validation
  - Duplicate detection
  - Invalid email filtering

---

### 2. **Smart Categorization System**

#### **Time-Based Categories (Email)**
Automatically categorize leads by when they were added:

**Categories:**
- **Today:** Leads added today
- **Yesterday:** Leads added yesterday
- **This Week:** Leads added in the last 7 days
- **Last Week:** Leads added 7-14 days ago
- **This Month:** Leads added this month
- **Last Month:** Leads added last month
- **Custom Date Range:** Select specific date range
- **By Specific Date:** Group by exact date (e.g., "30 leads - 19 Jan, 2025")

**Display Format:**
```
📅 19 Jan, 2025 - 30 leads
📅 18 Jan, 2025 - 25 leads
📅 17 Jan, 2025 - 42 leads
```

#### **Custom Categories (Both SMS & Email)**
- **Manual Categories:** Create custom categories
- **Auto-Categories:**
  - By upload batch (e.g., "Upload Batch #1 - Jan 19")
  - By source (e.g., "Facebook Ads", "Google Ads", "Organic")
  - By region (based on phone/email domain)
  - By engagement level (if tracking data available)

---

### 3. **Enhanced UI/UX**

#### **Tab-Based Interface**
```
┌─────────────────────────────────────────┐
│  [SMS Broadcast] [Email Broadcast]      │
└─────────────────────────────────────────┘
```

#### **SMS Broadcast Tab**
1. **Contact Management Section:**
   - Upload CSV/Excel button
   - View uploaded contacts (with category filter)
   - Edit/Delete categories
   - Merge categories
   - Export contacts by category

2. **Category Selection:**
   - Multi-select checkboxes for categories
   - Category count badges
   - Search/filter categories
   - "Select All" / "Deselect All"

3. **Message Composition:**
   - Rich text editor (with preview)
   - Character counter (SMS limit: 160 chars)
   - Template variables: `{name}`, `{phone}`, `{category}`
   - Save message templates
   - Load saved templates

4. **Send Options:**
   - Schedule send (future date/time)
   - Send immediately
   - Test send (to admin phone)
   - Preview message with sample data

#### **Email Broadcast Tab**
1. **Contact Management Section:**
   - Upload CSV/Excel button
   - View leads from `leads` table (with time-based categories)
   - View uploaded contacts
   - Time-based category grouping
   - Custom category management

2. **Category Selection:**
   - **Time-Based Categories:**
     - Today, Yesterday, This Week, etc.
     - Custom date range picker
     - Specific date selector
   - **Custom Categories:**
     - Uploaded contact categories
     - Manual categories
   - Multi-select with visual grouping

3. **Message Composition:**
   - Rich HTML editor (WYSIWYG)
   - Email template library
   - Template variables: `{name}`, `{email}`, `{date}`
   - Preview mode (desktop/mobile)
   - Subject line composer

4. **Send Options:**
   - Schedule send
   - Send immediately
   - Test send (to admin email)
   - Preview with sample data

---

## 🗄️ DATABASE STRUCTURE

### **New Table: `broadcast_contacts`**
```sql
CREATE TABLE broadcast_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  category TEXT, -- Custom category name
  source TEXT, -- 'upload', 'leads_table', 'manual'
  upload_batch_id UUID, -- Groups contacts from same upload
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- Additional data (tags, notes, etc.)
);

-- Indexes
CREATE INDEX idx_broadcast_contacts_category ON broadcast_contacts(category);
CREATE INDEX idx_broadcast_contacts_email ON broadcast_contacts(email);
CREATE INDEX idx_broadcast_contacts_phone ON broadcast_contacts(phone);
CREATE INDEX idx_broadcast_contacts_upload_batch ON broadcast_contacts(upload_batch_id);
CREATE INDEX idx_broadcast_contacts_created_at ON broadcast_contacts(created_at);
```

### **New Table: `broadcast_categories`**
```sql
CREATE TABLE broadcast_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'custom', 'time_based', 'upload_batch'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX idx_broadcast_categories_type ON broadcast_categories(type);
```

### **New Table: `broadcast_history`**
```sql
CREATE TABLE broadcast_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'sms', 'email'
  category_ids UUID[], -- Array of category IDs
  message TEXT NOT NULL,
  subject TEXT, -- For emails
  total_recipients INTEGER,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  status TEXT DEFAULT 'pending', -- 'pending', 'sending', 'completed', 'failed'
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_broadcast_history_type ON broadcast_history(type);
CREATE INDEX idx_broadcast_history_status ON broadcast_history(status);
CREATE INDEX idx_broadcast_history_created_at ON broadcast_history(created_at);
```

---

## 🎨 UI COMPONENT STRUCTURE

### **Main Component: `BulkBroadcast.tsx`**

```typescript
// State Management
const [activeTab, setActiveTab] = useState<'sms' | 'email'>('sms');
const [uploadedContacts, setUploadedContacts] = useState<Contact[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const [timeBasedGroups, setTimeBasedGroups] = useState<TimeGroup[]>([]);
```

### **Sub-Components:**

1. **`ContactUploader.tsx`**
   - File drag & drop
   - CSV/Excel parser
   - Validation & preview
   - Category assignment

2. **`CategoryManager.tsx`**
   - Create/edit/delete categories
   - Category list with counts
   - Merge categories
   - Category search/filter

3. **`TimeBasedGrouping.tsx`**
   - Date range picker
   - Group leads by date
   - Visual date grouping
   - Count display

4. **`CategorySelector.tsx`**
   - Multi-select checkboxes
   - Category tree view
   - Search functionality
   - Select all/none

5. **`MessageComposer.tsx`**
   - Rich text editor (for email)
   - Plain text editor (for SMS)
   - Template variables
   - Preview mode
   - Template library

6. **`SendOptions.tsx`**
   - Schedule picker
   - Test send button
   - Send immediately
   - Preview options

---

## 📊 FEATURE BREAKDOWN

### **Phase 1: Contact Upload & Storage**
- [ ] CSV/Excel file upload component
- [ ] File parsing (CSV/Excel)
- [ ] Data validation
- [ ] Database storage (`broadcast_contacts`)
- [ ] Duplicate detection & handling
- [ ] Upload batch tracking

### **Phase 2: Categorization System**
- [ ] Custom category creation
- [ ] Time-based category grouping
- [ ] Category assignment on upload
- [ ] Category management UI
- [ ] Category merge functionality

### **Phase 3: Time-Based Grouping (Email)**
- [ ] Query leads by date from `leads` table
- [ ] Group by: Today, Yesterday, Week, Month
- [ ] Custom date range selector
- [ ] Specific date grouping
- [ ] Visual date grouping display

### **Phase 4: Enhanced Selection UI**
- [ ] Category selector with checkboxes
- [ ] Time-based group selector
- [ ] Multi-select functionality
- [ ] Category count badges
- [ ] Search/filter categories

### **Phase 5: Message Composition**
- [ ] Rich text editor (Email)
- [ ] Plain text editor (SMS)
- [ ] Template variable support
- [ ] Template library
- [ ] Preview mode
- [ ] Character counter (SMS)

### **Phase 6: Send & Schedule**
- [ ] Schedule send functionality
- [ ] Test send (admin only)
- [ ] Progress tracking
- [ ] Send history
- [ ] Error reporting

---

## 🔧 IMPLEMENTATION DETAILS

### **File Upload Handler**

```typescript
// Parse CSV
const parseCSV = (file: File): Promise<Contact[]> => {
  // Use PapaParse or similar library
  // Validate columns
  // Return array of contacts
};

// Parse Excel
const parseExcel = (file: File): Promise<Contact[]> => {
  // Use xlsx library
  // Validate columns
  // Return array of contacts
};

// Validate & Save
const uploadContacts = async (contacts: Contact[], category?: string) => {
  // Validate each contact
  // Check duplicates
  // Assign category
  // Save to database
  // Return upload batch ID
};
```

### **Time-Based Grouping**

```typescript
// Group leads by date
const groupLeadsByDate = async () => {
  const { data: leads } = await supabase
    .from('leads')
    .select('name, email, phone, created_at')
    .order('created_at', { ascending: false });

  // Group by date
  const groups = new Map<string, Lead[]>();
  leads?.forEach(lead => {
    const date = new Date(lead.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)?.push(lead);
  });

  // Convert to array format
  return Array.from(groups.entries()).map(([date, leads]) => ({
    date,
    count: leads.length,
    leads
  }));
};
```

### **Category Management**

```typescript
// Create category
const createCategory = async (name: string, type: 'custom' | 'time_based') => {
  const { data } = await supabase
    .from('broadcast_categories')
    .insert({ name, type, created_by: user.id })
    .select()
    .single();
  return data;
};

// Assign contacts to category
const assignToCategory = async (contactIds: string[], categoryId: string) => {
  await supabase
    .from('broadcast_contacts')
    .update({ category: categoryId })
    .in('id', contactIds);
};
```

---

## 🎯 USER FLOW

### **SMS Broadcast Flow:**
1. Admin clicks "SMS Broadcast" tab
2. Upload contacts CSV/Excel OR select existing category
3. System auto-categorizes or admin assigns category
4. Admin selects category(ies) to send to
5. Admin composes SMS message
6. Admin previews/test sends
7. Admin schedules or sends immediately
8. System sends SMS to all contacts in selected categories
9. Progress tracking & results display

### **Email Broadcast Flow:**
1. Admin clicks "Email Broadcast" tab
2. **Option A:** Upload contacts CSV/Excel
3. **Option B:** Select from `leads` table (time-based grouping)
4. System shows time-based groups (e.g., "30 leads - 19 Jan, 2025")
5. Admin selects date groups or custom categories
6. Admin composes email (subject + body)
7. Admin previews/test sends
8. Admin schedules or sends immediately
9. System sends emails to all contacts in selected groups
10. Progress tracking & results display

---

## 📱 UI MOCKUP STRUCTURE

```
┌─────────────────────────────────────────────────────────┐
│  Bulk Broadcast                                         │
├─────────────────────────────────────────────────────────┤
│  [SMS] [Email]                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📤 Upload Contacts                                     │
│  [Drag & Drop CSV/Excel] or [Browse Files]             │
│                                                         │
│  📁 Categories                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☑ Upload Batch #1 - Jan 19 (45 contacts)       │   │
│  │ ☑ Facebook Ads - Jan 18 (32 contacts)          │   │
│  │ ☐ Google Ads - Jan 17 (28 contacts)            │   │
│  │ ☑ Organic - Jan 16 (15 contacts)               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ✉️ Compose Message                                     │
│  [Rich Text Editor / Plain Text Editor]                │
│  Variables: {name}, {phone}, {email}                   │
│                                                         │
│  ⚙️ Send Options                                        │
│  ○ Send Now  ○ Schedule: [Date/Time Picker]           │
│  [Test Send] [Preview] [Send Broadcast]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 NEXT STEPS

1. **Review & Approve Plan**
2. **Create Database Migrations**
3. **Build File Upload Component**
4. **Implement Categorization System**
5. **Build Time-Based Grouping**
6. **Enhance UI/UX**
7. **Add Scheduling**
8. **Testing & Refinement**

---

## 💡 ADDITIONAL IDEAS

- **A/B Testing:** Test different messages on sample groups
- **Analytics:** Track open rates, click rates, response rates
- **Segmentation:** Advanced segmentation (by behavior, engagement, etc.)
- **Templates:** Pre-built message templates library
- **Personalization:** Dynamic content based on user data
- **Automation:** Auto-send based on triggers (e.g., new lead added)
- **Export:** Export contact lists by category
- **Import:** Import from other sources (Google Sheets, etc.)

---

**Status:** 📝 Planning Phase  
**Priority:** High  
**Estimated Time:** 2-3 weeks for full implementation
