const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://evqerkqiquwxqlizdqmg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY3MTQ1NSwiZXhwIjoyMDcwMjQ3NDU1fQ.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw'
);

class BillingService {
  
  // Get billing history for a user
  static async getUserBillingHistory(userId) {
    try {
      console.log(`💰 Fetching billing history for user: ${userId}`);
      
      // Get subscription payments
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (subError) {
        console.error('❌ Error fetching subscriptions:', subError);
        throw subError;
      }

      // Get payment records (if you have a payments table)
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (paymentError && paymentError.code !== 'PGRST116') {
        console.error('❌ Error fetching payments:', paymentError);
        // Continue without payments if table doesn't exist
      }

      // Transform data into billing history format
      const billingHistory = [];

      // Add subscription records
      if (subscriptions) {
        subscriptions.forEach(sub => {
          billingHistory.push({
            id: `sub-${sub.id}`,
            type: 'subscription',
            amount: sub.amount || 2500,
            currency: sub.currency || 'NGN',
            status: sub.status,
            description: `${sub.plan_name} - ${sub.billing_cycle} billing`,
            date: sub.created_at,
            invoice_url: `#subscription-${sub.id}`,
            subscription_id: sub.id,
            paystack_subscription_id: sub.paystack_subscription_id,
            billing_cycle: sub.billing_cycle,
            start_date: sub.start_date,
            end_date: sub.end_date
          });
        });
      }

      // Add payment records
      if (payments) {
        payments.forEach(payment => {
          billingHistory.push({
            id: `payment-${payment.id}`,
            type: 'payment',
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            description: payment.description || 'Subscription Payment',
            date: payment.created_at,
            invoice_url: payment.invoice_url || `#payment-${payment.id}`,
            payment_id: payment.id,
            paystack_reference: payment.paystack_reference,
            payment_method: payment.payment_method
          });
        });
      }

      // Sort by date (newest first)
      billingHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log(`✅ Billing history fetched: ${billingHistory.length} records`);
      return billingHistory;

    } catch (error) {
      console.error('❌ BillingService.getUserBillingHistory error:', error);
      throw error;
    }
  }

  // Create a new billing record
  static async createBillingRecord(userId, billingData) {
    try {
      console.log(`💰 Creating billing record for user: ${userId}`);
      
      const recordData = {
        user_id: userId,
        amount: billingData.amount,
        currency: billingData.currency || 'NGN',
        status: billingData.status || 'pending',
        description: billingData.description,
        type: billingData.type || 'subscription',
        paystack_reference: billingData.paystack_reference,
        payment_method: billingData.payment_method,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into payments table (create if doesn't exist)
      const { data, error } = await supabase
        .from('payments')
        .insert(recordData)
        .select()
        .single();

      if (error) {
        // If payments table doesn't exist, create it
        if (error.code === '42P01') {
          console.log('📊 Payments table not found, creating it...');
          await this.createPaymentsTable();
          
          // Retry insert
          const { data: retryData, error: retryError } = await supabase
            .from('payments')
            .insert(recordData)
            .select()
            .single();

          if (retryError) {
            throw retryError;
          }
          
          console.log('✅ Billing record created after table creation');
          return retryData;
        }
        throw error;
      }

      console.log('✅ Billing record created successfully');
      return data;

    } catch (error) {
      console.error('❌ BillingService.createBillingRecord error:', error);
      throw error;
    }
  }

  // Create payments table if it doesn't exist
  static async createPaymentsTable() {
    try {
      console.log('📊 Creating payments table...');
      
      // This would require a migration file, but for now we'll handle it gracefully
      // In production, you should create proper migrations
      console.log('⚠️ Payments table creation requires migration file');
      
    } catch (error) {
      console.error('❌ Error creating payments table:', error);
      throw error;
    }
  }

  // Get invoice data for download
  static async getInvoiceData(billingId, userId) {
    try {
      console.log(`📄 Fetching invoice data for billing: ${billingId}`);
      
      // Get billing record
      const { data: billingRecord, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', billingId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      return billingRecord;

    } catch (error) {
      console.error('❌ BillingService.getInvoiceData error:', error);
      throw error;
    }
  }

  // Export billing history as CSV
  static async exportBillingHistory(userId, format = 'csv') {
    try {
      console.log(`📊 Exporting billing history for user: ${userId} as ${format}`);
      
      const billingHistory = await this.getUserBillingHistory(userId);
      
      if (format === 'csv') {
        return this.generateCSV(billingHistory);
      } else if (format === 'json') {
        return JSON.stringify(billingHistory, null, 2);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

    } catch (error) {
      console.error('❌ BillingService.exportBillingHistory error:', error);
      throw error;
    }
  }

  // Generate CSV from billing history
  static generateCSV(billingHistory) {
    const headers = ['Date', 'Description', 'Amount', 'Status', 'Type', 'Reference'];
    
    const csvRows = [
      headers.join(','),
      ...billingHistory.map(record => [
        new Date(record.date).toLocaleDateString(),
        `"${record.description}"`,
        record.amount,
        record.status,
        record.type,
        record.paystack_reference || record.paystack_subscription_id || 'N/A'
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}

module.exports = BillingService;
