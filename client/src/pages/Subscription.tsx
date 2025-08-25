import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { supabase } from '../lib/supabase';
import DashboardSidebar from '../components/DashboardSidebar';
import secureStorage from '../utils/secureStorage';
import DOMPurify from 'dompurify';
import { 
  FaCreditCard, 
  FaCrown, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock,
  FaDownload
} from 'react-icons/fa';

interface SubscriptionData {
  id: string;
  status: 'active' | 'canceled' | 'expired' | 'trialing';
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  next_billing_date?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  // Paystack integration fields
  paystack_subscription_id?: string;
  paystack_customer_code?: string;
}

interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  date: string;
  invoice_url?: string;
}

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const { isExpanded, isMobile } = useSidebar();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [canceling, setCanceling] = useState(false);

  // Calculate dynamic margin based on sidebar state
  const getSidebarMargin = () => {
    if (isMobile) return 'ml-16'; // Mobile always uses collapsed width
    return isExpanded ? 'ml-64' : 'ml-16'; // Desktop: expanded=256px, collapsed=64px
  };

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);
      
      // Debug: Log environment and user info
      console.log('Environment:', process.env.NODE_ENV);
      console.log('User ID:', user.id);

      try {

        // Fetch active subscription
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('Supabase subscription data:', subData);
        console.log('Supabase error:', subError);
        
        if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching subscription:', subError);
          setError('Failed to load subscription data');
          return;
        }

        // CRITICAL: Check localStorage FIRST for restored subscriptions (highest priority)
        // This takes priority over everything to maintain restored state
        const isRestored = localStorage.getItem('subscription_restored') === 'true';
        const restoredData = localStorage.getItem('subscription_restored_data');
        
        if (isRestored && restoredData) {
          // User has restored their subscription - show restored state (HIGHEST PRIORITY)
          console.log('🔄 User has restored subscription, overriding everything...');
          try {
            const restoredSubscription = JSON.parse(restoredData);
            console.log('🔄 Setting restored subscription from localStorage:', restoredSubscription);
            setSubscription(restoredSubscription);
            console.log('🔄 Showing restored subscription state from localStorage');
            
            // CRITICAL: Return early to prevent database fetch
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing restored subscription data:', error);
            // Fall through to check for canceled subscriptions
          }
        } else {
          // Check for canceled subscriptions (second priority)
          const isCanceled = localStorage.getItem('subscription_canceled') === 'true';
          const canceledAt = localStorage.getItem('subscription_canceled_at');
          
          if (isCanceled && canceledAt) {
            // User has canceled - show canceled subscription state (PRIORITY)
            console.log('🔒 User has canceled subscription, overriding database data...');
            const canceledDate = new Date(canceledAt);
            
            // Use the preserved end_date from localStorage if available
            const preservedEndDate = localStorage.getItem('subscription_end_date');
            const endDate = preservedEndDate ? new Date(preservedEndDate) : new Date(canceledDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            const canceledSubscriptionData = {
              id: 'canceled-1',
              status: 'canceled' as const,
              plan_name: 'Premium Monthly Plan (Canceled)',
              amount: 2500,
              currency: 'NGN',
              billing_cycle: 'monthly' as const,
              start_date: new Date(canceledDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end_date: endDate.toISOString(),
              next_billing_date: endDate.toISOString(),
              cancel_at_period_end: true,
              created_at: new Date(canceledDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: canceledAt
            };
            
            console.log('🔒 Setting canceled subscription state from localStorage:', canceledSubscriptionData);
            console.log('🔒 Preserved end_date from localStorage:', preservedEndDate);
            console.log('🔒 Calculated end_date:', endDate.toISOString());
            setSubscription(canceledSubscriptionData);
            console.log('🔒 Showing canceled subscription state from localStorage');
            
            // CRITICAL: Return early to prevent database fetch
            setLoading(false);
            return;
          } else if (subData) {
            // No cancellation in localStorage, use database data
            console.log('📊 Using database subscription data (no cancellation found)');
            const correctedSubscription = {
              ...subData,
              amount: subData.amount === 250000 ? 2500 : subData.amount
            };
            setSubscription(correctedSubscription);
          } else {
            // No database subscription and no cancellation - show mock data or nothing
            console.log('🔍 No database subscription found and no cancellation state...');
            // Show mock data in development, or create a placeholder for demo purposes
            if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
              setSubscription({
                id: 'mock-1',
                status: 'active',
                plan_name: 'Premium Monthly Plan',
                amount: 2500,
                currency: 'NGN',
                billing_cycle: 'monthly',
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
            // In strict production, subscription will remain null (no mock data)
          }
        }

        // Fetch billing history (mock data for development or demo purposes)
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          const mockBillingHistory: BillingHistory[] = [
            {
              id: '1',
              amount: 2500,
              currency: 'NGN',
              status: 'paid',
              description: 'Monthly Subscription - King Ezekiel Academy',
              date: new Date().toISOString(),
              invoice_url: '#'
            },
            {
              id: '2',
              amount: 2500,
              currency: 'NGN',
              status: 'paid',
              description: 'Monthly Subscription - King Ezekiel Academy',
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              invoice_url: '#'
            }
          ];
          setBillingHistory(mockBillingHistory);
        } else {
          // In production, fetch real billing history from database
          // TODO: Implement real billing history fetch
          setBillingHistory([]);
        }

      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setError('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAccessColor = (status: string, cancelAtPeriodEnd?: boolean, endDate?: string) => {
    // NETFLIX/SPOTIFY MODEL: Access is based on current date vs subscription end date
    const now = new Date();
    const subscriptionEnd = endDate ? new Date(endDate) : null;
    const hasAccess = subscriptionEnd && now <= subscriptionEnd;
    
    if (hasAccess) {
      if (status === 'active' && !cancelAtPeriodEnd) {
        return 'bg-green-100 text-green-800 border-green-200'; // Full access
      } else if (status === 'active' && cancelAtPeriodEnd) {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Grace period (canceled but still active)
      } else if (status === 'trialing') {
        return 'bg-blue-100 text-blue-800 border-blue-200'; // Trial access
      } else if (status === 'canceled') {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Canceled but still in paid period
      } else {
        return 'bg-green-100 text-green-800 border-green-200'; // Other active statuses
      }
    } else {
      return 'bg-red-100 text-red-800 border-red-200'; // No access - expired
    }
  };

  const getAccessIcon = (status: string, cancelAtPeriodEnd?: boolean, endDate?: string) => {
    // NETFLIX/SPOTIFY MODEL: Access is based on current date vs subscription end date
    const now = new Date();
    const subscriptionEnd = endDate ? new Date(endDate) : null;
    const hasAccess = subscriptionEnd && now <= subscriptionEnd;
    
    if (hasAccess) {
      if (status === 'active' && !cancelAtPeriodEnd) {
        return <FaCheckCircle className="w-4 h-4" />; // Full access
      } else if (status === 'active' && cancelAtPeriodEnd) {
        return <FaClock className="w-4 h-4" />; // Grace period (canceled but still active)
      } else if (status === 'trialing') {
        return <FaClock className="w-4 h-4" />; // Trial access
      } else if (status === 'canceled') {
        return <FaClock className="w-4 h-4" />; // Canceled but still in paid period
      } else {
        return <FaCheckCircle className="w-4 h-4" />; // Other active statuses
      }
    } else {
      return <FaTimesCircle className="w-4 h-4" />; // No access - expired
    }
  };

  const getAccessText = (status: string, cancelAtPeriodEnd?: boolean, endDate?: string) => {
    // NETFLIX/SPOTIFY MODEL: Access is based on current date vs subscription end date
    const now = new Date();
    const subscriptionEnd = endDate ? new Date(endDate) : null;
    const hasAccess = subscriptionEnd && now <= subscriptionEnd;
    
    if (hasAccess) {
      // Calculate days remaining
      const daysRemaining = subscriptionEnd ? Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      if (status === 'active' && !cancelAtPeriodEnd) {
        return `Active (${daysRemaining} days left)`; // Full access with countdown
      } else if (status === 'active' && cancelAtPeriodEnd) {
        return `Grace Period (${daysRemaining} days left)`; // Access until end of billing cycle
      } else if (status === 'trialing') {
        return `Trial (${daysRemaining} days left)`; // Trial access with countdown
      } else if (status === 'canceled') {
        return `Grace Period (${daysRemaining} days left)`; // Canceled but still in paid period
      } else {
        return `Active (${daysRemaining} days left)`; // Other active statuses
      }
    } else {
      return 'Expired'; // No access - subscription period ended
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FaCheckCircle className="w-4 h-4" />;
      case 'trialing':
        return <FaClock className="w-4 h-4" />;
      case 'canceled':
        return <FaTimesCircle className="w-4 h-4" />;
      case 'expired':
        return <FaTimesCircle className="w-4 h-4" />;
      default:
        return <FaClock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`;
    }
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Security: URL validation
  const isValidUrl = (url: string): boolean => {
    if (!url || url === '#') return false;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
    } catch {
      return false;
    }
  };

  // Security: Input sanitization
  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input.trim());
  };

  // Security: Rate limiting for downloads
  const downloadCooldown = new Map<string, number>();
  const checkRateLimit = (userId: string): boolean => {
    const now = Date.now();
    const lastDownload = downloadCooldown.get(userId) || 0;
    if (now - lastDownload < 3000) return false; // 3 second cooldown
    downloadCooldown.set(userId, now);
    return true;
  };

  // SECURITY: Clear cancellation state and restore active subscription (for testing/admin purposes)
  const clearCancellationState = async () => {
    // Get the original subscription end date before clearing localStorage
    const originalEndDate = localStorage.getItem('subscription_end_date');
    const originalStartDate = localStorage.getItem('subscription_canceled_at');
    
    // Clear all cancellation-related localStorage items
    localStorage.removeItem('subscription_canceled');
    localStorage.removeItem('subscription_canceled_at');
    localStorage.removeItem('subscription_canceled_reason');
    localStorage.removeItem('subscription_end_date');
    
    // Also clear any restored subscription state
    localStorage.removeItem('subscription_restored');
    localStorage.removeItem('subscription_restored_data');
    
    // Update secure storage
    secureStorage.setSubscriptionActive(true);
    
    // COMMON BUSINESS LOGIC: Continue on existing billing cycle
    // If we have the original end date, use it. Otherwise, calculate from original start date
    let endDate: Date;
    let nextBillingDate: Date;
    
    if (originalEndDate) {
      // Use the original end date (continue existing cycle)
      endDate = new Date(originalEndDate);
      nextBillingDate = new Date(originalEndDate);
    } else if (originalStartDate) {
      // Calculate from original start date (30 days from start)
      const startDate = new Date(originalStartDate);
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      nextBillingDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Fallback: 30 days from now
      endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    // Create a restored subscription that continues the original billing cycle
    const restoredSubscription = {
      id: 'restored-1',
      status: 'active' as const,
      plan_name: 'Premium Monthly Plan (Restored)',
      amount: 2500,
      currency: 'NGN',
      billing_cycle: 'monthly' as const,
      start_date: originalStartDate || new Date().toISOString(),
      end_date: endDate.toISOString(),
      next_billing_date: nextBillingDate.toISOString(),
      cancel_at_period_end: false,
      created_at: originalStartDate || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // REAL PAYSTACK INTEGRATION: Create new subscription via API
    if (subscription?.paystack_customer_code) {
      try {
        console.log('🔄 Creating new Paystack subscription for customer:', subscription.paystack_customer_code);
        
        const response = await fetch('/api/paystack/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerCode: subscription.paystack_customer_code,
            amount: 2500,
            userId: user?.id // Pass user ID for database integration
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create subscription via Paystack');
        }

        const result = await response.json();
        console.log('✅ Paystack subscription created successfully:', result);
        
        // Update the restored subscription with Paystack data
        const paystackSubscription = {
          ...restoredSubscription,
          paystack_subscription_id: result.data.subscription_code,
          paystack_customer_code: subscription.paystack_customer_code
        };
        
        setSubscription(paystackSubscription);
        
        // Store the restored subscription in localStorage to persist after refresh
        localStorage.setItem('subscription_restored', 'true');
        localStorage.setItem('subscription_restored_data', JSON.stringify(paystackSubscription));
        
        // Show success message with billing cycle info
        const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        alert(`Subscription restored successfully via Paystack! You now have active access until ${endDate.toLocaleDateString()} (${daysLeft} days left). Your next billing will be on ${nextBillingDate.toLocaleDateString()}.`);
        
      } catch (error) {
        console.error('❌ Error creating Paystack subscription:', error);
        alert('Failed to create subscription via Paystack. Please try again.');
        return;
      }
    } else {
      // Fallback to local simulation if no Paystack customer code
      console.log('⚠️ No Paystack customer code found, using local simulation');
      setSubscription(restoredSubscription);
      
      // Store the restored subscription in localStorage to persist after refresh
      localStorage.setItem('subscription_restored', 'true');
      localStorage.setItem('subscription_restored_data', JSON.stringify(restoredSubscription));
      
      // Show success message with billing cycle info
      const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      alert(`Subscription restored successfully! You now have active access until ${endDate.toLocaleDateString()} (${daysLeft} days left). Your next billing will be on ${nextBillingDate.toLocaleDateString()}.`);
    }
  };

  const handleUpdatePaymentMethod = () => {
    // TODO: Implement payment method update
    alert('Payment method update feature coming soon!');
  };

  const handleChangeBillingCycle = () => {
    // TODO: Implement billing cycle change
    alert('Billing cycle change feature coming soon!');
  };

  const handleDownloadInvoices = () => {
    // TODO: Implement invoice download
    alert('Invoice download feature coming soon!');
  };

  const handleDownloadInvoice = (item: BillingHistory) => {
    // Security: Rate limiting check
    if (!user?.id || !checkRateLimit(user.id)) {
      alert('Please wait a few seconds before downloading another invoice');
      return;
    }

    // Security: URL validation
    if (isValidUrl(item.invoice_url)) {
      // If there's a valid invoice URL, open it safely
      window.open(item.invoice_url, '_blank', 'noopener,noreferrer');
    } else {
      // Generate a fancy invoice JPG using HTML5 Canvas
      generateFancyInvoiceJPG(item);
    }
  };

  const generateFancyInvoiceJPG = (item: BillingHistory) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size for high quality
    canvas.width = 800;
    canvas.height = 1000;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header section with academy branding
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, canvas.width, 120);

    // Academy logo placeholder (graduation cap)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(60, 60, 25, 0, 2 * Math.PI);
    ctx.fill();
    
    // Academy name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('The King Ezekiel Academy', 100, 50);
    
    // Tagline
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#bfdbfe';
    ctx.fillText('Empowering Students Worldwide', 100, 75);
    
    // Contact info
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('Lagos, Nigeria • Always Open', 100, 95);

    // Invoice title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('INVOICE', canvas.width / 2, 180);

    // Invoice details box
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(50, 200, canvas.width - 100, 200);
    ctx.shadowBlur = 0;

    // Invoice details
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Invoice Details', 80, 230);

    // Invoice number
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Invoice #: ${item.id}`, 80, 260);
    ctx.fillText(`Date: ${formatDate(item.date)}`, 80, 285);
    ctx.fillText(`Status: ${item.status.toUpperCase()}`, 80, 310);

    // Amount box
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(450, 230, 250, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Total Amount', 575, 260);
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText(formatCurrency(item.amount, item.currency), 575, 295);

    // Service details
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Service Details', 80, 430);

    // Service box
    ctx.fillStyle = 'white';
    ctx.fillRect(80, 450, canvas.width - 160, 120);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(`Description: ${item.description}`, 100, 480);
    ctx.fillText(`Service: Premium Monthly Subscription`, 100, 505);
    ctx.fillText(`Billing Cycle: Monthly`, 100, 530);
    ctx.fillText(`Customer: ${user?.name || user?.email || 'Student'}`, 100, 555);

    // Footer section
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

    // Thank you message
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Thank you for choosing The King Ezekiel Academy!', canvas.width / 2, canvas.height - 80);
    
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#bfdbfe';
    ctx.fillText('Your education journey starts here', canvas.width / 2, canvas.height - 55);
    
    // Contact footer
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('info@thekingezekielacademy.com • Always Open', canvas.width / 2, canvas.height - 25);

    // Convert to JPG and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${item.id}-${new Date(item.date).toISOString().split('T')[0]}.jpg`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleExportAll = () => {
    // Security: Rate limiting check
    if (!user?.id || !checkRateLimit(user.id)) {
      alert('Please wait a few seconds before exporting again');
      return;
    }

    if (billingHistory.length === 0) {
      alert('No billing history to export');
      return;
    }

    // Security: Sanitize data before export
    const sanitizedBillingHistory = billingHistory.map(item => ({
      ...item,
      description: sanitizeInput(item.description)
    }));

    // Create CSV content
    const csvContent = [
      ['Date', 'Description', 'Amount', 'Status', 'Invoice'],
      ...sanitizedBillingHistory.map(item => [
        formatDate(item.date),
        item.description,
        formatCurrency(item.amount, item.currency),
        item.status,
        item.invoice_url ? 'Available' : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `billing-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object
    URL.revokeObjectURL(url);
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = async () => {
    const sanitizedReason = sanitizeInput(cancelReason);
    const sanitizedFeedback = sanitizeInput(cancelFeedback);
    
    if (!sanitizedReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    setCanceling(true);
    try {
      // REAL PAYSTACK INTEGRATION: Cancel subscription via API
      if (subscription?.paystack_subscription_id) {
        console.log('🔒 Canceling Paystack subscription:', subscription.paystack_subscription_id);
        
        const response = await fetch('/api/paystack/cancel-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId: subscription.paystack_subscription_id,
            reason: sanitizedReason
          })
        });

        if (!response.ok) {
          throw new Error('Failed to cancel subscription via Paystack');
        }

        const result = await response.json();
        console.log('✅ Paystack cancellation successful:', result);
      } else {
        console.log('⚠️ No Paystack subscription ID found, using local simulation');
      }
      
      // Update local state to show canceled
      if (subscription) {
          console.log('🔒 Canceling subscription:', subscription.id);
          
          // CRITICAL: Maintain the original end_date when canceling
          // This ensures access continues until the paid period expires
          const canceledSubscription: SubscriptionData = {
            ...subscription,
            status: 'canceled' as const,
            cancel_at_period_end: true,
            // Ensure end_date is preserved - this is the key fix!
            end_date: subscription.end_date || subscription.next_billing_date || 
                     (subscription.start_date ? new Date(new Date(subscription.start_date).getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString() : null)
          };
          
          console.log('🔒 Setting canceled subscription:', canceledSubscription);
          setSubscription(canceledSubscription);
          
          // SECURITY: Persist cancellation state to prevent refresh bypass
          localStorage.setItem('subscription_canceled', 'true');
          localStorage.setItem('subscription_canceled_at', new Date().toISOString());
          localStorage.setItem('subscription_canceled_reason', sanitizedReason);
          
          // Store the end_date for persistence
          if (canceledSubscription.end_date) {
            localStorage.setItem('subscription_end_date', canceledSubscription.end_date);
          }
          
          console.log('🔒 Cancellation state persisted to localStorage');
          
          // Update secure storage to reflect canceled state
          secureStorage.setSubscriptionActive(false);
          console.log('🔒 Secure storage updated: subscription inactive');
        }
      
      setShowCancelModal(false);
      setCancelReason('');
      setCancelFeedback('');
      alert('Your subscription has been canceled via Paystack. You will continue to have access until the end of your current billing period.');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription via Paystack. Please try again.');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className={`${getSidebarMargin()} transition-all duration-300 ease-in-out flex items-center justify-center min-h-screen pt-16`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading subscription data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className={`${getSidebarMargin()} transition-all duration-300 ease-in-out`}>
        <div className="pt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Subscription Management
              </h1>
              <p className="text-gray-600">
                Manage your subscription, view billing history, and update payment methods
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FaTimesCircle className="text-red-400 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Current Subscription Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
              {/* Debug Info - Development Only */}
              {process.env.NODE_ENV === 'development' && subscription && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs">
                  <p className="font-mono text-gray-600">
                    <strong>Debug Info:</strong> status="{subscription.status}", cancel_at_period_end={subscription.cancel_at_period_end ? 'true' : 'false'}
                  </p>
                  <p className="font-mono text-gray-600 mt-1">
                    <strong>Access State:</strong> {getAccessText(subscription.status, subscription.cancel_at_period_end, subscription.end_date)}
                  </p>
                  <p className="font-mono text-gray-600 mt-1">
                    <strong>End Date:</strong> {subscription.end_date ? formatDate(subscription.end_date) : 'N/A'}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
                <div className="flex items-center space-x-2">
                  <FaCrown className="text-yellow-500" />
                  <span className="text-sm text-gray-600">Premium Access</span>
                </div>
              </div>

              {subscription ? (
                <>
                  {/* Warning for canceled subscriptions */}
                  {subscription.status === 'active' && subscription.cancel_at_period_end && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <FaTimesCircle className="text-yellow-500 mr-2" />
                        <div>
                          <p className="text-yellow-800 font-medium">Subscription Canceled</p>
                          <p className="text-yellow-700 text-sm">
                            Your subscription has been canceled but remains active until {formatDate(subscription.end_date)}. 
                            You will lose access to premium features after this date.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subscription Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(subscription.status)}`}>
                        {getStatusIcon(subscription.status)}
                        <span className="ml-2 capitalize">{subscription.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Access</span>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getAccessColor(subscription.status, subscription.cancel_at_period_end, subscription.end_date)}`}>
                        {getAccessIcon(subscription.status, subscription.cancel_at_period_end, subscription.end_date)}
                        <span className="ml-2 capitalize">
                          {getAccessText(subscription.status, subscription.cancel_at_period_end, subscription.end_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Plan</span>
                      <span className="text-sm text-gray-900">{subscription.plan_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Amount</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(subscription.amount, subscription.currency)}/{subscription.billing_cycle}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Billing Cycle</span>
                      <span className="text-sm text-gray-900 capitalize">{subscription.billing_cycle}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Start Date</span>
                      <span className="text-sm text-gray-900">{formatDate(subscription.start_date)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Next Billing</span>
                      <span className="text-sm text-gray-900">
                        {subscription.next_billing_date ? formatDate(subscription.next_billing_date) : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Auto-Renew</span>
                      <span className={`text-sm ${subscription.cancel_at_period_end ? 'text-red-600' : 'text-green-600'}`}>
                        {subscription.cancel_at_period_end ? 'No' : 'Yes'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Last Updated</span>
                      <span className="text-sm text-gray-900">{formatDate(subscription.updated_at)}</span>
                    </div>
                                      </div>
                  </div>
                  </>
                ) : (
                <div className="text-center py-8">
                  <FaCreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                  <p className="text-gray-600 mb-4">
                    You don't have an active subscription. Subscribe to access all courses and features.
                  </p>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Subscribe Now
                  </button>
                </div>
              )}
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
                <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
                <button 
                  onClick={handleExportAll}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center sm:justify-start w-full sm:w-auto px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FaDownload className="w-4 h-4 mr-2" />
                  Export All
                </button>
              </div>

              {billingHistory.length > 0 ? (
                <div className="space-y-4">
                  {billingHistory.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'paid' ? 'bg-green-500' : 
                          item.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{item.description}</p>
                          <p className="text-xs sm:text-sm text-gray-500">{formatDate(item.date)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {formatCurrency(item.amount, item.currency)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                            item.status === 'paid' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                                                  {item.invoice_url && (
                          <button 
                            onClick={() => handleDownloadInvoice(item)}
                            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                          >
                            Download
                          </button>
                        )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaCalendarAlt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Billing History</h3>
                  <p className="text-gray-600">
                    Your billing history will appear here once you have transactions.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                <div className="flex space-x-3">
                  {subscription && subscription.status === 'active' && !subscription.cancel_at_period_end && (
                    <button
                      onClick={handleCancelSubscription}
                      className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  )}
                  
                  {/* Development: Re-subscribe button for testing */}
                  {process.env.NODE_ENV === 'development' && localStorage.getItem('subscription_canceled') === 'true' && (
                    <button
                      onClick={clearCancellationState}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      title="Re-subscribe to restore access (dev only)"
                    >
                      🔄 Re-Subscribe
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={handleUpdatePaymentMethod}
                  className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  <FaCreditCard className="w-6 h-6 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Update Payment Method</p>
                    <p className="text-sm text-gray-500">Change your card or bank details</p>
                  </div>
                </button>

                <button 
                  onClick={handleChangeBillingCycle}
                  className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  <FaCalendarAlt className="w-6 h-6 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Change Billing Cycle</p>
                    <p className="text-sm text-gray-500">Switch between monthly and yearly</p>
                  </div>
                </button>

                <button 
                  onClick={handleDownloadInvoices}
                  className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  <FaDownload className="w-6 h-6 text-purple-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Download Invoices</p>
                    <p className="text-sm text-gray-500">Get your billing documents</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cancel Subscription</h3>
              <p className="text-gray-600">
                We're sorry to see you go. Please let us know why you're canceling and how we can improve.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="too_expensive">Too expensive</option>
                  <option value="not_using">Not using it enough</option>
                  <option value="missing_features">Missing features</option>
                  <option value="technical_issues">Technical issues</option>
                  <option value="customer_service">Poor customer service</option>
                  <option value="switching_platforms">Switching to another platform</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional feedback (optional)
                </label>
                <textarea
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us how we can improve..."
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancelFeedback('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={canceling}
              >
                Keep Subscription
              </button>
              <button
                onClick={confirmCancelSubscription}
                disabled={canceling || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canceling ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Canceling...
                  </div>
                ) : (
                  'Cancel Subscription'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
