-- =====================================================
-- CREATE BROADCAST TABLES FOR ENHANCED BULK BROADCAST
-- =====================================================
-- This migration creates tables for contact upload,
-- categorization, and broadcast history
-- =====================================================

-- Table: broadcast_contacts
-- Stores uploaded contacts for SMS/Email broadcasts
CREATE TABLE IF NOT EXISTS broadcast_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  category TEXT, -- Custom category name
  source TEXT DEFAULT 'upload', -- 'upload', 'leads_table', 'manual'
  upload_batch_id UUID, -- Groups contacts from same upload
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data (tags, notes, etc.)
  
  -- Ensure at least email or phone is provided
  CONSTRAINT check_contact_info CHECK (
    (email IS NOT NULL AND email != '') OR 
    (phone IS NOT NULL AND phone != '')
  )
);

-- Indexes for broadcast_contacts
CREATE INDEX IF NOT EXISTS idx_broadcast_contacts_category ON broadcast_contacts(category);
CREATE INDEX IF NOT EXISTS idx_broadcast_contacts_email ON broadcast_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_broadcast_contacts_phone ON broadcast_contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_broadcast_contacts_upload_batch ON broadcast_contacts(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_contacts_created_at ON broadcast_contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_contacts_source ON broadcast_contacts(source);

-- Table: broadcast_categories
-- Manages custom categories for organizing contacts
CREATE TABLE IF NOT EXISTS broadcast_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'custom', -- 'custom', 'time_based', 'upload_batch'
  description TEXT,
  color TEXT, -- Hex color for UI display
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  CONSTRAINT check_category_type CHECK (type IN ('custom', 'time_based', 'upload_batch'))
);

-- Indexes for broadcast_categories
CREATE INDEX IF NOT EXISTS idx_broadcast_categories_type ON broadcast_categories(type);
CREATE INDEX IF NOT EXISTS idx_broadcast_categories_created_by ON broadcast_categories(created_by);

-- Table: broadcast_history
-- Tracks all broadcast sends (SMS/Email)
CREATE TABLE IF NOT EXISTS broadcast_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'sms', 'email'
  category_ids TEXT[], -- Array of category names/IDs
  category_names TEXT[], -- Array of category names for display
  message TEXT NOT NULL,
  subject TEXT, -- For emails
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  status TEXT DEFAULT 'pending', -- 'pending', 'sending', 'completed', 'failed', 'cancelled'
  error_message TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_broadcast_type CHECK (type IN ('sms', 'email')),
  CONSTRAINT check_broadcast_status CHECK (status IN ('pending', 'sending', 'completed', 'failed', 'cancelled'))
);

-- Indexes for broadcast_history
CREATE INDEX IF NOT EXISTS idx_broadcast_history_type ON broadcast_history(type);
CREATE INDEX IF NOT EXISTS idx_broadcast_history_status ON broadcast_history(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_history_created_at ON broadcast_history(created_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_history_created_by ON broadcast_history(created_by);
CREATE INDEX IF NOT EXISTS idx_broadcast_history_scheduled_at ON broadcast_history(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_broadcast_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_broadcast_contacts_updated_at
  BEFORE UPDATE ON broadcast_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_broadcast_contacts_updated_at();

-- Enable Row Level Security
ALTER TABLE broadcast_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins can do everything
CREATE POLICY "Admins can manage broadcast_contacts"
  ON broadcast_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage broadcast_categories"
  ON broadcast_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage broadcast_history"
  ON broadcast_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE broadcast_contacts IS 'Stores uploaded contacts for SMS/Email broadcasts with categorization';
COMMENT ON TABLE broadcast_categories IS 'Manages custom categories for organizing broadcast contacts';
COMMENT ON TABLE broadcast_history IS 'Tracks all broadcast sends with status and statistics';

COMMENT ON COLUMN broadcast_contacts.source IS 'Source of contact: upload (from CSV/Excel), leads_table (from leads table), or manual (manually added)';
COMMENT ON COLUMN broadcast_contacts.upload_batch_id IS 'Groups contacts uploaded in the same batch';
COMMENT ON COLUMN broadcast_contacts.metadata IS 'Additional JSON data: tags, notes, custom fields';

COMMENT ON COLUMN broadcast_categories.type IS 'Category type: custom (user-created), time_based (auto-generated by date), upload_batch (auto-generated by upload)';
COMMENT ON COLUMN broadcast_categories.color IS 'Hex color code for UI display (e.g., #FF5733)';

COMMENT ON COLUMN broadcast_history.category_ids IS 'Array of category IDs or names used for this broadcast';
COMMENT ON COLUMN broadcast_history.category_names IS 'Array of category names for display purposes';
