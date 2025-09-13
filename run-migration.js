const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔧 Running course scheduling migration...');
    
    // Add scheduling columns to courses table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add course scheduling fields
        ALTER TABLE courses ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
        ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;
        ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));
        
        -- Add indexes for scheduled courses queries
        CREATE INDEX IF NOT EXISTS idx_courses_scheduled_for ON courses(scheduled_for);
        CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
        CREATE INDEX IF NOT EXISTS idx_courses_is_scheduled ON courses(is_scheduled);
        
        -- Update existing courses to have proper status
        UPDATE courses SET status = 'published' WHERE status IS NULL;
      `
    });

    if (alterError) {
      console.error('❌ Migration failed:', alterError);
      return;
    }

    console.log('✅ Migration completed successfully!');
    
    // Test the new columns
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, is_scheduled, status, scheduled_for')
      .limit(1);
    
    if (error) {
      console.error('❌ Test query failed:', error);
    } else {
      console.log('✅ Test query successful:', data);
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

runMigration();
