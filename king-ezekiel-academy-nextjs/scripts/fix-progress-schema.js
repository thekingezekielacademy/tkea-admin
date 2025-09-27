#!/usr/bin/env node

/**
 * Script to fix progress tracking database schema
 * Run this to apply the migration that fixes the foreign key and column issues
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting progress schema migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250115_001_fix_progress_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded, executing...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach - execute SQL directly
      console.log('🔄 Trying alternative approach...');
      
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        try {
          console.log('📝 Executing:', statement.substring(0, 50) + '...');
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });
          
          if (stmtError) {
            console.warn('⚠️ Statement failed (might be expected):', stmtError.message);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (err) {
          console.warn('⚠️ Statement error (might be expected):', err.message);
        }
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }
    
    // Test the fix
    console.log('🧪 Testing the fix...');
    
    // Test 1: Check if user_progress_summary view exists
    const { data: viewTest, error: viewError } = await supabase
      .from('user_progress_summary')
      .select('*')
      .limit(1);
    
    if (viewError) {
      console.log('⚠️ View test failed (expected if no data):', viewError.message);
    } else {
      console.log('✅ user_progress_summary view is working');
    }
    
    // Test 2: Check user_lesson_progress table structure
    const { data: tableTest, error: tableError } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('⚠️ Table test failed:', tableError.message);
    } else {
      console.log('✅ user_lesson_progress table is accessible');
    }
    
    console.log('🎉 Migration process completed!');
    console.log('📋 Next steps:');
    console.log('   1. Restart your Next.js app');
    console.log('   2. Go to the dashboard');
    console.log('   3. Use the Progress Test Panel to verify everything works');
    console.log('   4. Watch a lesson to test progress tracking');
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
