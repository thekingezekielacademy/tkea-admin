# 🏗️ BUILD COMMUNITY Database Structure

## Overview
This document outlines all database tables and logic used to track BUILD COMMUNITY access and purchases.

---

## 📊 Database Tables

### 1. **`product_purchases`** (Primary Table)
**Purpose:** Tracks all product purchases including BUILD COMMUNITY access

**Key Columns:**
- `id` (UUID) - Primary key
- `buyer_id` (UUID, nullable) - References `profiles(id)`
- `buyer_email` (TEXT, nullable) - For guest purchases
- `product_id` (UUID) - The product being purchased
- `product_type` (TEXT) - **Values: `'course'`, `'learning_path'`, `'live_class'`**
- `amount_paid` (DECIMAL) - Minimum: 1 (1 kobo)
- `purchase_price` (DECIMAL) - Minimum: 1 (1 kobo) - CHECK CONSTRAINT
- `payment_status` (TEXT) - Usually `'success'`
- `access_granted` (BOOLEAN) - Must be `true` for access
- `access_granted_at` (TIMESTAMP)
- `payment_reference` (TEXT)
- `access_token` (TEXT)

**BUILD COMMUNITY Purchase Record:**
- `product_type = 'live_class'`
- `payment_status = 'success'`
- `access_granted = true`
- `product_id` = Any active `live_classes.id` (used as placeholder)

---

### 2. **`profiles`** (User Table)
**Purpose:** User profile information

**Key Columns:**
- `id` (UUID) - Primary key, references `auth.users(id)`
- `email` (TEXT) - User email
- `name` (TEXT) - User name
- `phone` (TEXT, nullable) - Phone number for SMS
- `role` (TEXT) - User role (e.g., 'admin', 'student')

---

### 3. **`leads`** (Leads Table)
**Purpose:** Stores leads from headless lead generation funnel automation (for "Hasn't Paid for BUILD" group)

**Key Columns:**
- `name` (TEXT) - Lead name
- `email` (TEXT) - Lead email
- `number` (TEXT) - Lead phone number

**Note:** Leads are included in the "Hasn't Paid for BUILD" group for broadcast messaging.

---

### 4. **`courses`** (Course Catalog)
**Purpose:** Course information

**Key Columns:**
- `id` (UUID) - Primary key
- `title` (TEXT) - Course title
- `status` (TEXT) - Usually `'published'`

**BUILD COMMUNITY Courses (5 courses):**
1. `'FREELANCING - THE UNTAPPED MARKET'`
2. `'INFORMATION MARKETING: THE INFINITE CASH LOOP'`
3. `'YOUTUBE MONETIZATION: From Setup To Monetization'`
4. `'EARN 500K SIDE INCOME SELLING EBOOKS'`
5. `'CPA MARKETING BLUEPRINT: TKEA RESELLERS'`

---

### 5. **`live_class_access`** (Live Class Access)
**Purpose:** Grants access to live classes

**Key Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID, NOT NULL) - References `profiles(id)`
- `live_class_id` (UUID, nullable) - References `live_classes(id)`
  - **`NULL` = Access to ALL live classes**
- `session_id` (UUID, nullable) - References `class_sessions(id)`
- `access_type` (TEXT) - Values: `'full_course'`, `'single_class'`, `'free'`
- `granted_at` (TIMESTAMP)

**Note:** This table is separate from `product_purchases` and is used for live class access control.

---

### 6. **`live_classes`** (Live Classes Catalog)
**Purpose:** Live class information

**Key Columns:**
- `id` (UUID) - Primary key
- `is_active` (BOOLEAN) - Whether the live class is active
- `title` (TEXT) - Live class title

---

## 🔍 How BUILD Access is Determined

### **Method 1: Direct Purchase Record (Primary Method)**
A user has BUILD COMMUNITY access if they have a `product_purchases` record with:
```sql
product_type = 'live_class'
AND payment_status = 'success'
AND access_granted = true
AND (buyer_id = :userId OR buyer_email = :userEmail)
```

### **Method 2: Legacy Method (3+ BUILD Courses)**
A user has BUILD COMMUNITY access if they have purchased **at least 3 of the 5 BUILD courses**:
```sql
-- Count distinct BUILD courses purchased
SELECT COUNT(DISTINCT c.id) as build_course_count
FROM product_purchases pp
INNER JOIN courses c ON pp.product_id = c.id
WHERE pp.product_type = 'course'
  AND pp.payment_status = 'success'
  AND pp.access_granted = true
  AND (pp.buyer_id = :userId OR pp.buyer_email = :userEmail)
  AND (
    c.title ILIKE '%FREELANCING%UNTAPPED MARKET%' OR
    c.title ILIKE '%INFORMATION MARKETING%INFINITE CASH LOOP%' OR
    c.title ILIKE '%YOUTUBE MONETIZATION%' OR
    c.title ILIKE '%EARN 500K SIDE INCOME SELLING EBOOKS%' OR
    c.title ILIKE '%CPA MARKETING BLUEPRINT%TKEA RESELLERS%'
  )
HAVING COUNT(DISTINCT c.id) >= 3
```

**Note:** The fix script (`fix_build_community_access_records.sql`) creates missing `product_type='live_class'` records for users who have 3+ BUILD courses but are missing the direct purchase record.

---

## ✅ Complete BUILD Access Check Logic

A user has BUILD COMMUNITY access if **EITHER**:

1. **Has `product_type='live_class'` record:**
   ```sql
   EXISTS (
     SELECT 1 FROM product_purchases
     WHERE product_type = 'live_class'
       AND payment_status = 'success'
       AND access_granted = true
       AND (buyer_id = :userId OR buyer_email = :userEmail)
   )
   ```

2. **OR has 3+ BUILD courses:**
   ```sql
   (
     SELECT COUNT(DISTINCT c.id)
     FROM product_purchases pp
     INNER JOIN courses c ON pp.product_id = c.id
     WHERE pp.product_type = 'course'
       AND pp.payment_status = 'success'
       AND pp.access_granted = true
       AND (pp.buyer_id = :userId OR pp.buyer_email = :userEmail)
       AND c.title IN (
         'FREELANCING - THE UNTAPPED MARKET',
         'INFORMATION MARKETING: THE INFINITE CASH LOOP',
         'YOUTUBE MONETIZATION: From Setup To Monetization',
         'EARN 500K SIDE INCOME SELLING EBOOKS',
         'CPA MARKETING BLUEPRINT: TKEA RESELLERS'
       )
   ) >= 3
   ```

---

## 🎯 For Bulk Broadcast Feature

### **"Paid for BUILD" Group:**
Users who have BUILD COMMUNITY access via **EITHER** method above.

### **"Hasn't Paid for BUILD" Group:**
Users who **DO NOT** have BUILD COMMUNITY access via either method, **PLUS** all leads from the `leads` table.

**Includes:**
1. Users from `profiles` table who haven't paid for BUILD
2. All leads from the `leads` table (from headless lead generation funnel automation)

**Note:** Duplicates are removed by email address.

---

## 📝 Important Notes

1. **Guest Users:** Can have purchases tracked by `buyer_email` only (no `buyer_id`)
2. **User Linking:** Guest purchases can be linked to user accounts when they sign up
3. **Multiple Records:** A user might have multiple `product_purchases` records for the same product (duplicates should be handled)
4. **Live Class ID:** The `product_id` in `product_type='live_class'` records is just a placeholder - any active live class ID works

---

## 🔧 Database Constraints

- `product_purchases.purchase_price` must be > 0 (CHECK constraint)
- `product_purchases.amount_paid` must be > 0 (CHECK constraint)
- `product_purchases.product_type` must be IN ('course', 'learning_path', 'live_class')
