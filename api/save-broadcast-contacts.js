export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { contacts, category, source = 'upload' } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Contacts array is required and must not be empty'
      });
    }

    // Get Supabase client (you'll need to configure this)
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase configuration missing'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate upload batch ID
    const uploadBatchId = require('crypto').randomUUID();

    // Prepare contacts for insertion
    const contactsToInsert = contacts.map(contact => ({
      name: contact.name || null,
      email: contact.email || null,
      phone: contact.phone || null,
      category: category || contact.category || null,
      source: source,
      upload_batch_id: uploadBatchId,
      metadata: {}
    }));

    // Insert contacts in batches (Supabase has a limit of 1000 rows per insert)
    const batchSize = 1000;
    let insertedCount = 0;
    let errors = [];

    for (let i = 0; i < contactsToInsert.length; i += batchSize) {
      const batch = contactsToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('broadcast_contacts')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        insertedCount += data?.length || 0;
      }
    }

    if (insertedCount === 0 && errors.length > 0) {
      return res.status(500).json({
        success: false,
        error: `Failed to insert contacts: ${errors.join('; ')}`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        inserted: insertedCount,
        total: contacts.length,
        upload_batch_id: uploadBatchId,
        category: category || null
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[save-broadcast-contacts API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to save contacts'
    });
  }
}
