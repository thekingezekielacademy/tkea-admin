import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { supabase } from '../lib/supabase';
import DashboardSidebar from '../components/DashboardSidebar';
import SimpleFlutterwaveModal from '../components/SimpleFlutterwaveModal';
import secureStorage from '../utils/secureStorage';
import flutterwaveService from '../services/flutterwaveService';
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
  // Flutterwave integration fields
  flutterwave_subscription_id?: string;
  flutterwave_customer_code?: string;
}

interface BillingHistory {
  id: string;
  type?: 'subscription' | 'payment';
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  date: string;
  invoice_url?: string;
  subscription_id?: string;
  flutterwave_subscription_id?: string;
  flutterwave_reference?: string;
  billing_cycle?: string;
  start_date?: string;
  end_date?: string;
  payment_method?: string;
}

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const { isExpanded, isMobile } = useSidebar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');

  // Calculate dynamic margin based on sidebar state
  const getSidebarMargin = () => {
    if (isMobile) return 'ml-16'; // Mobile always uses collapsed width
    return isExpanded ? 'ml-64' : 'ml-16'; // Desktop: expanded=256px, collapsed=64px
  };

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Debug: Check user authentication
      console.log('🔍 Debug: User object:', user);
      console.log('🔍 Debug: User ID:', user.id);
      
      // Check if user session is fully loaded
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('🔍 Debug: Auth context:', { user: authUser, error: authError });
      
      if (authError || !authUser) {
        console.log('⚠️ Auth not ready, waiting...');
        // Wait a bit and try again
        setTimeout(() => fetchSubscriptionStatus(), 1000);
        return;
      }
      
      // Debug: Log the query parameters
      console.log('🔍 Debug: Query parameters:', {
        user_id: user.id,
        status: 'active',
        order: 'created_at.desc',
        limit: 1
      });
      
      // Debug: Log Supabase client state
      console.log('🔍 Debug: Supabase client state:', {
        hasAuth: !!supabase.auth,
        session: await supabase.auth.getSession()
      });
      
      // Fetch from Supabase first
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')  // Add status filter like Profile.tsx
        .order('created_at', { ascending: false })  // Add ordering like Profile.tsx
        .limit(1);  // Remove .single() to handle empty results

      console.log('🔍 Debug: Supabase response:', { data: supabaseData, error: supabaseError });

      if (supabaseData && supabaseData.length > 0 && !supabaseError) {
        // Use real Supabase data - this is the source of truth
        const subscriptionData = supabaseData[0];
        // Calculate proper dates for monthly subscription
        const now = new Date();
        let startDate = new Date(subscriptionData.created_at);
        
        // If the created_at date is in the future, use current date as start
        if (startDate > now) {
          console.log('⚠️ Created date is in future, using current date as start');
          startDate = now;
        }
        
        // Use the actual next_payment_date from database if it exists
        let endDate: Date;
        let nextBillingDate: Date;
        
        // Always calculate next billing date as 30 days from start
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        nextBillingDate = new Date(endDate.getTime());
        
        // If we have a next_payment_date from database, use that instead
        if (subscriptionData.next_payment_date) {
          nextBillingDate = new Date(subscriptionData.next_payment_date);
        }
        
        // Debug: Log the date calculations
        console.log('🔍 Date Debug:', {
          created_at: subscriptionData.created_at,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          nextBillingDate: nextBillingDate.toISOString(),
          currentDate: now.toISOString(),
          next_payment_date: subscriptionData.next_payment_date,
          calculated_next_billing: nextBillingDate.toISOString()
        });
        
        const subscription = {
          id: subscriptionData.id,
          status: subscriptionData.status,
          plan_name: subscriptionData.plan_name,
          amount: subscriptionData.amount === 250000 ? 2500 : subscriptionData.amount, // Fix amount display
          currency: subscriptionData.currency || 'NGN',
          billing_cycle: 'monthly' as const,
          start_date: subscriptionData.created_at,
          end_date: endDate.toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          flutterwave_subscription_id: subscriptionData.flutterwave_subscription_id, // Use existing column
          flutterwave_customer_code: subscriptionData.flutterwave_customer_code, // Use existing column
          created_at: subscriptionData.created_at,
          updated_at: subscriptionData.updated_at,
          cancel_at_period_end: subscriptionData.cancel_at_period_end || false
        };

        setSubscription(subscription);
        
        // Only set localStorage if we don't have subscription data there
        const existingLocal = localStorage.getItem('subscription');
        if (!existingLocal) {
          localStorage.setItem('subscription', JSON.stringify(subscription));
        }
        
        return; // Exit early, don't check localStorage
      }

      // If Supabase has no data (empty array) or there's an error, clear any existing subscription
      console.log('❌ No subscription found in database - clearing subscription state');
      setSubscription(null);
      // Clear any stale localStorage data
      localStorage.removeItem('subscription');
      localStorage.removeItem('flutterwave_subscription_id');
      localStorage.removeItem('flutterwave_customer_code');
      return;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
      localStorage.removeItem('subscription');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Add a small delay to ensure database operations have completed
      const timer = setTimeout(() => {
        fetchSubscriptionStatus();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, fetchSubscriptionStatus]);

  // Add a refresh on page load to catch any new subscriptions
  useEffect(() => {
    const handlePageLoad = () => {
      if (user) {
        fetchSubscriptionStatus();
      }
    };

    // Refresh immediately when component mounts
    handlePageLoad();

    // Also refresh when the page becomes visible (user comes back from payment)
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchSubscriptionStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchSubscriptionStatus]);

  useEffect(() => {
    const fetchBillingHistory = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);
      
      try {
        // Use Supabase data directly instead of calling non-existent API
        // Create billing history from subscription data
        if (subscription) {
          const subscriptionBilling: BillingHistory = {
            id: `sub-${subscription.id}`,
            type: 'subscription' as const,
            amount: subscription.amount,
            currency: subscription.currency || 'NGN',
            status: mapSubscriptionStatusToBillingStatus(subscription.status),
            description: `${subscription.plan_name} - Monthly billing`,
            date: subscription.start_date,
            invoice_url: `#subscription-${subscription.id}`,
            subscription_id: subscription.id,
            flutterwave_subscription_id: subscription.flutterwave_subscription_id,
            billing_cycle: 'monthly',
            start_date: subscription.start_date,
            end_date: subscription.next_billing_date || subscription.end_date,
            flutterwave_reference: subscription.flutterwave_subscription_id
          };
          setBillingHistory([subscriptionBilling]);
        } else {
          setBillingHistory([]);
        }
      } catch (error) {
        console.error('❌ Error creating billing history from subscription:', error);
        setBillingHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingHistory();
  }, [user?.id, subscription]);

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
    // For active subscriptions, always show active access
    if (status === 'active') {
      if (cancelAtPeriodEnd) {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Grace period (canceled but still active)
      } else {
        return 'bg-green-100 text-green-800 border-green-200'; // Full access
      }
    } else if (status === 'trialing') {
      return 'bg-blue-100 text-blue-800 border-blue-200'; // Trial access
    } else if (status === 'canceled') {
      return 'bg-red-100 text-red-800 border-red-200'; // Canceled
    } else if (status === 'expired') {
      return 'bg-gray-100 text-gray-800 border-gray-200'; // Expired
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200'; // Default
    }
  };

  const getAccessIcon = (status: string, cancelAtPeriodEnd?: boolean, endDate?: string) => {
    // For active subscriptions, always show active access
    if (status === 'active') {
      if (cancelAtPeriodEnd) {
        return <FaClock className="w-4 h-4" />; // Grace period (canceled but still active)
      } else {
        return <FaCheckCircle className="w-4 h-4" />; // Full access
      }
    } else if (status === 'trialing') {
      return <FaClock className="w-4 h-4" />; // Trial access
    } else if (status === 'canceled') {
      return <FaTimesCircle className="w-4 h-4" />; // Canceled
    } else if (status === 'expired') {
      return <FaTimesCircle className="w-4 h-4" />; // Expired
    } else {
      return <FaTimesCircle className="w-4 h-4" />; // Default
    }
  };

  const getAccessText = (status: string, cancelAtPeriodEnd?: boolean, endDate?: string) => {
    // For active subscriptions, always show active access
    if (status === 'active') {
      if (cancelAtPeriodEnd) {
        return 'Grace Period'; // Canceled but still active
      } else {
        return 'Active'; // Full access
      }
    } else if (status === 'trialing') {
      return 'Trial'; // Trial access
    } else if (status === 'canceled') {
      return 'Canceled'; // Canceled
    } else if (status === 'expired') {
      return 'Expired'; // Expired
    } else {
      return 'Unknown'; // Default
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

  // Helper function to map subscription status to billing status
  const mapSubscriptionStatusToBillingStatus = (subscriptionStatus: string): 'paid' | 'pending' | 'failed' => {
    switch (subscriptionStatus) {
      case 'active':
        return 'paid';
      case 'canceled':
        return 'paid'; // Canceled subscriptions were paid
      case 'expired':
        return 'paid'; // Expired subscriptions were paid
      case 'trialing':
        return 'pending'; // Trial subscriptions are pending
      default:
        return 'paid'; // Default to paid for other statuses
    }
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
    
    // REAL FLUTTERWAVE INTEGRATION: Create new subscription via API
    if (subscription?.flutterwave_customer_code) {
      try {
        console.log('🔄 Creating new Flutterwave subscription for customer:', subscription.flutterwave_customer_code);
        
        const response = await fetch('/api/flutterwave/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerCode: subscription.flutterwave_customer_code,
            email: user?.email,
            userId: user?.id // Pass user ID for database integration
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create subscription via Flutterwave');
        }

        const result = await response.json();
        console.log('✅ Flutterwave subscription created successfully:', result);
        
        // Update the restored subscription with Flutterwave data
        const flutterwaveSubscription = {
          ...restoredSubscription,
          flutterwave_subscription_id: result.data.subscription_id,
          flutterwave_customer_code: subscription.flutterwave_customer_code
        };
        
        setSubscription(flutterwaveSubscription);
        
        // Store the restored subscription in localStorage to persist after refresh
        localStorage.setItem('subscription_restored', 'true');
        localStorage.setItem('subscription_restored_data', JSON.stringify(flutterwaveSubscription));
        
        // Show success message with billing cycle info
        const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        alert(`Subscription restored successfully via Flutterwave! You now have active access until ${endDate.toLocaleDateString()} (${daysLeft} days left). Your next billing will be on ${nextBillingDate.toLocaleDateString()}.`);
        
      } catch (error) {
        console.error('❌ Error creating Flutterwave subscription:', error);
        alert('Failed to create subscription via Flutterwave. Please try again.');
        return;
      }
    } else {
      // Fallback to local simulation if no Flutterwave customer code
      console.log('⚠️ No Flutterwave customer code found, using local simulation');
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

  const handleExportAll = async () => {
    // Security: Rate limiting check
    if (!user?.id || !checkRateLimit(user.id)) {
      alert('Please wait a few seconds before exporting again');
      return;
    }

    if (billingHistory.length === 0) {
      alert('No billing history to export');
      return;
    }

    try {
      console.log('📊 Exporting billing history...');
      
      // Use real API to export billing history
      const response = await fetch(`/api/flutterwave/billing-history/${user.id}?format=csv`);
      
      if (response.ok) {
        const csvContent = await response.text();
        
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
        URL.revokeObjectURL(url);
        
        console.log('✅ Billing history exported successfully');
      } else {
        throw new Error('Failed to export billing history');
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      
      // Fallback to local CSV generation
      console.log('🔄 Using fallback CSV generation...');
      const sanitizedBillingHistory = billingHistory.map(item => ({
        ...item,
        description: sanitizeInput(item.description)
      }));

      const csvContent = [
        ['Date', 'Description', 'Amount', 'Status', 'Type', 'Reference'],
                 ...sanitizedBillingHistory.map(item => [
           formatDate(item.date),
           item.description,
           formatCurrency(item.amount, item.currency),
           item.status,
           item.type || 'subscription',
           item.flutterwave_reference || 'N/A'
         ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `billing-history-fallback-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = async () => {
    if (!subscription?.flutterwave_subscription_id) {
      setError('No subscription ID found');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null); // Clear previous success messages

      console.log('🔒 Canceling Flutterwave subscription:', subscription.flutterwave_subscription_id);

      // Use the Flutterwave service for secure cancellation
      const result = await flutterwaveService.cancelSubscription(
        subscription.flutterwave_subscription_id
      );

      if (result.success) {
        // Update local subscription status
        setSubscription(prev => prev ? { ...prev, status: 'canceled' } : null);
        setSuccess(result.message);
        
        // Update database status
        const { error: dbError } = await supabase
          .from('user_subscriptions')
          .update({ status: 'canceled' })
          .eq('id', subscription.id);
        
        if (dbError) {
          console.error('Database update error:', dbError);
        }
        
        if (!dbError) {
          console.log('✅ Subscription cancelled successfully and database updated');
        } else {
          console.warn('⚠️ Subscription cancelled but database update failed');
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
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

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-400 mr-2" />
                  <span className="text-green-800">{success}</span>
                </div>
              </div>
            )}

            {/* Current Subscription Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
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
                        {formatCurrency(subscription.amount, subscription.currency)}/month
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
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
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
                  
                  {/* Re-subscribe button for canceled subscriptions */}
                  {subscription && subscription.status === 'canceled' && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Subscribe Again
                    </button>
                  )}
                  
                  {/* Development: Re-subscribe button for testing - only show if explicitly needed */}
                  {process.env.NODE_ENV === 'development' && 
                   localStorage.getItem('subscription_canceled') === 'true' && 
                   (!subscription || subscription.status === 'canceled') && (
                    <button
                      onClick={clearCancellationState}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      title="Re-subscribe to restore access (dev only)"
                    >
                      🔄 Re-Subscribe (Dev)
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
              >
                Keep Subscription
              </button>
              <button
                onClick={confirmCancelSubscription}
                disabled={!cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
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

      {/* Payment Modal */}
      <SimpleFlutterwaveModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          // Refresh subscription data
          fetchSubscriptionStatus();
        }}
        user={user}
        planName="Monthly Membership"
        amount={2500}
      />
    </div>
  );
};

export default Subscription;
