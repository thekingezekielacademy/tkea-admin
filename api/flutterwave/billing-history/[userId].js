// Dynamic imports for Vercel serverless functions

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://app.thekingezekielacademy.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Dynamic import for Vercel serverless functions
    const axios = (await import('axios')).default;
    
    const { userId } = req.query;
    const { format = 'json' } = req.query;
    
    console.log('📝 Getting Flutterwave billing history:', { userId, format });

    const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!FLUTTERWAVE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Flutterwave not configured on server' });
    }

    // Get transactions for the user
    const response = await axios.get('https://api.flutterwave.com/v3/transactions', {
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last year
        to: new Date().toISOString().split('T')[0], // Today
        page: 1,
        per_page: 100
      }
    });

    const result = response.data;

    if (result.status === 'success') {
      const transactions = result.data || [];
      
      if (format === 'csv') {
        // Generate CSV format
        const csvHeader = 'Date,Reference,Amount,Currency,Status,Description\n';
        const csvRows = transactions.map(tx => 
          `${tx.created_at?.split('T')[0] || ''},${tx.tx_ref || ''},${tx.amount || 0},${tx.currency || 'NGN'},${tx.status || ''},${tx.narration || ''}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="billing-history-${userId}.csv"`);
        res.send(csvHeader + csvRows);
      } else {
        res.json({
          success: true,
          message: 'Billing history retrieved successfully',
          data: transactions
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to retrieve billing history'
      });
    }

  } catch (error) {
    console.error('❌ Flutterwave billing history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve billing history. Please try again.' 
    });
  }
}
