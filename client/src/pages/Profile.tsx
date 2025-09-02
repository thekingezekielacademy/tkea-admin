import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { supabase } from '../lib/supabase';
import secureStorage from '../utils/secureStorage';
import DashboardSidebar from '../components/DashboardSidebar';
import { FaEdit, FaEnvelope, FaUser, FaImage, FaKey, FaSave, FaTimes, FaCreditCard, FaHistory } from 'react-icons/fa';
import subscriptionService from '../services/subscriptionService';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const Profile: React.FC = () => {
  const { user, updateProfile, fetchProfile } = useAuth();
  const { isExpanded, isMobile } = useSidebar();

  // Calculate dynamic margin based on sidebar state
  const getSidebarMargin = () => {
    if (isMobile) return 'ml-16'; // Mobile always uses collapsed width
    return isExpanded ? 'ml-64' : 'ml-16'; // Desktop: expanded=256px, collapsed=64px
  };

  const [showEditName, setShowEditName] = useState(false);
  const [showEditBio, setShowEditBio] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [showCancelFlow, setShowCancelFlow] = useState(false);
  const [cancelStep, setCancelStep] = useState<1 | 2>(1);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelOther, setCancelOther] = useState<string>('');
  const [cancelUnderstand, setCancelUnderstand] = useState<boolean>(false);
  // Real subscription data from database
  const [subscription, setSubscription] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(true);
  
  // Check subscription status from localStorage and update state
  const [subActive, setSubActive] = useState<boolean>(() => {
    try { return secureStorage.isSubscriptionActive(); } catch { return false; }
  });

  // Update subActive when secure storage changes
  useEffect(() => {
    const checkSecureStorage = () => {
      try {
        const isActive = secureStorage.isSubscriptionActive();
        console.log('🔄 Secure storage check - subscription_active:', isActive);
        setSubActive(isActive);
      } catch {
        console.log('❌ Error reading secure storage');
        setSubActive(false);
      }
    };

    // Check immediately
    checkSecureStorage();

    // Set up interval to check for changes (since sessionStorage doesn't fire storage events)
    const interval = setInterval(checkSecureStorage, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  // Removed unused state variables

  const [nameInput, setNameInput] = useState(user?.name || '');
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const MAX_BIO = 300;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Paystack config
  const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
  const PAYSTACK_PLAN_CODE = process.env.REACT_APP_PAYSTACK_PLAN_CODE;
  const [paystackReady, setPaystackReady] = useState(false);
  const [paystackError, setPaystackError] = useState<string | null>(null);
  

  
  // Fetch real subscription data from database
  const fetchSubscriptionData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setSubscriptionLoading(true);
      setBillingLoading(true);
      
      // Fetch active subscription
      try {
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!subError && subData) {
          setSubscription(subData);
          setSubActive(true); // Update subscription status
          console.log('✅ Found active subscription:', subData);
        } else {
          console.log('No active subscription found');
          setSubscription(null);
          setSubActive(false); // Update subscription status
        }
      } catch (tableError) {
        console.log('user_subscriptions table not available yet, using secure storage fallback');
        // Check secure storage for fallback data
        const secureSubActive = secureStorage.isSubscriptionActive();
        console.log('Secure storage subscription status:', secureSubActive);
        
        if (secureSubActive) {
          const subscriptionData = secureStorage.getSubscriptionData();
          const fallbackSubscription = {
            plan_name: 'Monthly Membership',
            status: 'active',
            amount: 250000,
            currency: 'NGN',
            start_date: new Date().toISOString(),
            migration: 'secure storage fallback',
            next_payment_date: subscriptionData.subscription_next_renewal || new Date().toISOString(),
          };
          setSubscription(fallbackSubscription);
          setSubActive(true); // Update subscription status
          console.log('✅ Set subscription active from secure storage fallback');
        } else {
          setSubscription(null);
          setSubActive(false); // Update subscription status
          console.log('❌ No active subscription in secure storage');
        }
      }
      
      // Fetch billing history
      try {
        const { data: billingData, error: billingError } = await supabase
          .from('subscription_payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!billingError && billingData) {
          setBillingHistory(billingData);
          console.log('✅ Found billing history:', billingData);
        } else {
          console.log('No billing history found');
          setBillingHistory([]);
        }
      } catch (tableError) {
        console.log('subscription_payments table not available yet, using secure storage fallback');
        // Check secure storage for fallback data
        const secureSubActive = secureStorage.isSubscriptionActive();
        console.log('Secure storage billing fallback, subscription active:', secureSubActive);
        
        if (secureSubActive) {
          const subscriptionData = secureStorage.getSubscriptionData();
          const fallbackPayment = {
            id: 'secure-1',
            amount: 250000,
            currency: 'NGN',
            status: 'success',
            created_at: subscriptionData.subscription_next_renewal || new Date().toISOString(),
          };
          setBillingHistory([fallbackPayment]);
          console.log('✅ Set billing history from secure storage fallback');
        } else {
          setBillingHistory([]);
          console.log('❌ No billing history in secure storage');
        }
      }
      
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setSubscription(null);
      setBillingHistory([]);
    } finally {
      setSubscriptionLoading(false);
      setBillingLoading(false);
    }
  }, [user?.id]);

  // Load Paystack script early and mark ready on load
  useEffect(() => {
    if (!PAYSTACK_PUBLIC_KEY) {
      setPaystackError('Paystack public key not configured');
      return;
    }
    
    const id = 'paystack-inline-js';
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).PaystackPop) setPaystackReady(true);
      else existing.addEventListener('load', () => setPaystackReady(true));
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.async = true;
    s.onload = () => setPaystackReady(true);
    s.onerror = () => setPaystackError('Failed to load Paystack script');
    document.body.appendChild(s);
  }, [PAYSTACK_PUBLIC_KEY]);

  // Fetch subscription data when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionData();
    }
  }, [user?.id, fetchSubscriptionData]);

  const createReference = () => `KEA-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  // Function to verify payment on server
  const verifyPaymentOnServer = async (reference: string, userId: string) => {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, userId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Payment verified successfully on server:', result.data);
        // You can add additional logic here if needed
      } else {
        console.warn('Payment verification warning:', result.message);
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      // Don't show error to user as payment was successful
    }
  };

  const startSubscription = () => {
    try {
      // Clear previous messages
      setMessage(null);
      setError(null);
      
      // Validation checks
      if (!user?.email) {
        setError('Sign in required to subscribe');
        return;
      }
      
      if (!PAYSTACK_PUBLIC_KEY) {
        setError('Paystack is not configured. Please contact support.');
        return;
      }
      
      if (!PAYSTACK_PLAN_CODE) {
        setError('Subscription plan not configured. Please contact support.');
        return;
      }
      
      if (!window.PaystackPop) {
        setError('Payment library not loaded yet. Please wait a moment and try again.');
        return;
      }
      
      const ref = createReference();
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        plan: PAYSTACK_PLAN_CODE,
        ref,
        amount: 250000, // Amount in kobo (₦2,500 = 250,000 kobo)
        currency: 'NGN',
        callback: function(response: any) {
          console.log('Paystack payment successful:', response);
          
          // Verify the payment was successful
          if (response.status === 'success') {
          try {
              // Calculate next renewal date
            const next = new Date();
            next.setMonth(next.getMonth() + 1);
            const nextStr = next.toISOString().slice(0,10);
              
              // Update UI state immediately
          setSubActive(true);
          setShowManageSubscription(false);
              
              setMessage(`Subscription started successfully! Reference: ${response.reference || ref}`);
              
                            // ALWAYS update secureStorage immediately for instant UI feedback
              secureStorage.setSubscriptionData({
                subscription_active: 'true',
                subscription_ref: response.reference || ref,
                subscription_amount: '2500',
                subscription_currency: 'NGN',
                subscription_next_renewal: nextStr
              });
              
              // Save to database (this is the primary storage)
              if (user?.id) {
                // Use setTimeout to avoid blocking the callback
                setTimeout(() => {
                  // Create an async function inside setTimeout
                  const saveToDatabase = async () => {
                    try {
                      // Save subscription record
                      const { error: subError } = await supabase
                        .from('user_subscriptions')
                        .insert({
                          user_id: user.id,
                          paystack_subscription_id: response.reference || ref,
                          paystack_customer_code: user.email,
                          plan_name: 'Monthly Membership',
                          status: 'active',
                          amount: 250000, // ₦2,500 in kobo
                          currency: 'NGN',
                          start_date: new Date().toISOString(),
                          next_payment_date: next.toISOString(),
                        });
                      
                      if (subError) {
                        console.error('Error saving subscription to database:', subError);
                        console.log('⚠️ Database save failed, but secureStorage is already updated');
                      } else {
                        console.log('✅ Subscription saved to database successfully');
                      }
                      
                      // Save payment record
                      const { error: paymentError } = await supabase
                        .from('subscription_payments')
                        .insert({
                          user_id: user.id,
                          paystack_transaction_id: response.reference || ref,
                          paystack_reference: response.reference || ref,
                          amount: 250000, // ₦2,500 in kobo
                          currency: 'NGN',
                          status: 'success',
                          payment_method: 'card',
                          paid_at: new Date().toISOString(),
                        });
                      
                      if (paymentError) {
                        console.error('Error saving payment to database:', paymentError);
                      } else {
                        console.log('✅ Payment saved to database successfully');
                      }
                      
                      // Refresh subscription data to show updated status
                      fetchSubscriptionData();
                      
                    } catch (error) {
                      console.error('Error saving to database:', error);
                      console.log('⚠️ Database save failed, but secureStorage is already updated');
                    }
                  };
                  
                  // Call the async function
                  saveToDatabase();
                }, 100);
              }
              
              // Send verification to your backend
              verifyPaymentOnServer(response.reference, user.id);

              
            } catch(e) {
              console.error('Error storing subscription data:', e);
              setError('Payment successful but failed to update subscription status. Please contact support.');
            }
          } else {
            setError('Payment was not successful. Please try again.');
          }
        },
        onClose: function() {
          setMessage('Payment window closed. You can try again anytime.');
        }
      });
      
      handler.openIframe();
      
    } catch (e: any) {
      console.error('Paystack initialization error:', e);
      setError(e?.message || 'Failed to initialize payment. Please try again.');
    }
  };


  // Keep inputs in sync if profile changes elsewhere
  useEffect(() => {
    setNameInput(user?.name || '');
    setBioInput(user?.bio || '');
  }, [user?.name, user?.bio]);

  // Fetch subscription data when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionData();
    }
  }, [user?.id, fetchSubscriptionData]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      const safety = setTimeout(() => setUploading(false), 10000);
      // Validate
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        throw new Error('Please upload a JPG, PNG, or WEBP image');
      }
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxBytes) {
        throw new Error('Image must be 5MB or smaller');
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: false });
      if (upErr) throw new Error(upErr.message || 'Failed to upload file');
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const { error: updErr } = await updateProfile({ avatar_url: publicUrl } as any);
      if (updErr) throw new Error(updErr.message || 'Failed to update avatar URL');
      setMessage('Profile photo updated');
      try { await fetchProfile(); } catch (_) {}
      clearTimeout(safety);
    } catch (e: any) {
      setError(e?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !user?.avatar_url) return;
    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      const safety = setTimeout(() => setUploading(false), 8000);
      // Best-effort delete of existing object if URL is public
      try {
        const url = user.avatar_url;
        const marker = '/storage/v1/object/public/avatars/';
        const idx = url.indexOf(marker);
        if (idx !== -1) {
          const key = url.substring(idx + marker.length);
          await supabase.storage.from('avatars').remove([key]);
        }
      } catch (_) {}
      const { error: updErr } = await updateProfile({ avatar_url: null as any });
      if (updErr) throw new Error(updErr.message || 'Failed to remove avatar');
      setMessage('Profile photo removed');
      try { await fetchProfile(); } catch (_) {}
      clearTimeout(safety);
    } catch (e: any) {
      setError(e?.message || 'Failed to remove photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { error: updErr } = await updateProfile({ name: trimmed } as any);
      if (updErr) {
        // Fallback: use SECURITY DEFINER RPC to upsert name without touching role
        const { data: gu } = await supabase.auth.getUser();
        const uid = gu?.user?.id;
        const email = gu?.user?.email || user?.email || '';
        if (uid) {
          const { error: rpcErr } = await supabase.rpc('create_profile', {
            p_id: uid,
            p_name: trimmed,
            p_email: email,
            p_bio: null,
            p_role: null,
          });
          if (rpcErr) throw new Error(rpcErr.message || 'Failed to create profile');
        } else {
          throw new Error(updErr.message || 'Failed to update name');
        }
      }
      setShowEditName(false);
      setMessage('Name updated');
      await fetchProfile();
    } catch (e: any) {
      setError(e?.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBio = async () => {
    if (bioInput.length > MAX_BIO) {
      setError(`Bio must be ${MAX_BIO} characters or fewer`);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { error: updErr } = await updateProfile({ bio: bioInput } as any);
      if (updErr) throw new Error(updErr.message || 'Failed to update bio');
      setShowEditBio(false);
      setMessage('Bio updated');
      await fetchProfile();
    } catch (e: any) {
      setError(e?.message || 'Failed to update bio');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updErr) throw new Error(updErr.message || 'Failed to update password');
      setShowChangePassword(false);
      setMessage('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
                   <div className={`${getSidebarMargin()} transition-all duration-300 ease-in-out`}>
        <div className="pt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main card */}
        <div className="lg:col-span-2 bg-white border rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

          {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">{message}</div>}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

          <div className="flex items-start gap-4 md:gap-6 flex-col sm:flex-row">
            {/* Avatar */}
            <div>
              <div
                className={`relative w-28 h-28 rounded-full overflow-hidden border bg-gray-100 cursor-pointer group ${uploading ? 'opacity-70' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile photo"
                role="button"
              >
                                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FaUser className="h-10 w-10" />
                  </div>
                )}
                {/* Camera overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition">
                  <div className="text-white/90 text-xs px-2 py-1 rounded bg-black/50 hidden group-hover:block">Change</div>
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <svg className="animate-spin h-6 w-6 text-primary-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <FaImage /> Change Photo
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarUpload(f);
                    }}
                    disabled={uploading}
                  />
                </label>
                {user?.avatar_url && (
                  <button onClick={handleRemoveAvatar} disabled={uploading} className="px-3 py-2 border rounded-lg text-sm text-red-600 hover:bg-red-50">
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">JPG, PNG, or WEBP. Max 5MB.</p>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-5 w-full">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="text-lg font-semibold text-gray-900">{user?.name || '—'}</div>
                </div>
                                  <button onClick={() => { setNameInput(user?.name || ''); setShowEditName(true); }} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
                  <FaEdit /> Edit
                </button>
              </div>

              <div className="flex items-start justify-between">
                <div className="max-w-prose">
                  <div className="text-sm text-gray-500">Bio</div>
                  <div className="text-gray-800 whitespace-pre-wrap">{user?.bio || 'Tell us about yourself.'}</div>
                </div>
                                  <button onClick={() => { setBioInput(user?.bio || ''); setShowEditBio(true); }} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
                  <FaEdit /> Edit
                </button>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <FaEnvelope />
                <span>{user?.email || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side actions */}
        <div className="space-y-6">
          {/* Subscription */}
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : (() => {
              console.log('🔍 Profile render - subscription:', subscription, 'subActive:', subActive);
              return (subscription || subActive);
            })() ? (
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Plan</span>
                  <span className="font-medium text-primary-700">{subscription?.plan_name || 'Monthly Membership'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Amount</span>
                  <span className="font-medium text-primary-700">₦{(subscription?.amount || 250000) / 100}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Started</span>
                  <span>{subscription?.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'Recently'}</span>
                </div>
                {subscription?.next_payment_date && (
                  <div className="flex items-center justify-between">
                    <span>Next Payment</span>
                    <span>{new Date(subscription.next_payment_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Plan</span>
                  <span className="font-medium text-gray-500">No Active Plan</span>
              </div>
              <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Inactive</span>
              </div>
                <div className="flex items-center justify-between">
                  <span>Renews</span>
                  <span>—</span>
                </div>
                </div>
              )}
            <button onClick={() => setShowManageSubscription(true)} className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              (subscription || subActive)
                ? 'border rounded-lg hover:bg-gray-50' 
                : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}>
              {(subscription || subActive) ? 'Manage Subscription' : 'Subscribe here'}
            </button>
            <button
              onClick={fetchSubscriptionData}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <FaCreditCard className="h-4 w-4" />
              Refresh Status
            </button>
          </div>

          {/* Billing History */}
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaHistory className="h-5 w-5" />
              Billing History
            </h2>
            {billingLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading billing history...</span>
              </div>
            ) : billingHistory.length > 0 ? (
            <div className="space-y-3 text-sm">
                {billingHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="text-gray-700">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-gray-800 font-medium">
                      ₦{(payment.amount / 100).toLocaleString()}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'success' ? 'bg-green-100 text-green-700' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="text-center py-8">
                <FaHistory className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No billing history yet</p>
                <p className="text-sm text-gray-400">Your payment history will appear here once you make your first subscription payment.</p>
              </div>
            )}
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
            <button onClick={() => setShowChangePassword(true)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <FaKey /> Change Password
            </button>
          </div>
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Tips</h2>
            <p className="text-sm text-gray-600">Use a real name and a friendly bio so instructors and peers can recognize you.</p>
          </div>
        </div>

        {/* Edit Name Modal */}
        {showEditName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditName(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Name</h3>
                <button onClick={() => setShowEditName(false)} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
              </div>
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full px-3 py-2 border rounded mb-4" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowEditName(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={handleSaveName} disabled={saving || !nameInput.trim()} className={`px-4 py-2 rounded text-white ${(!saving && nameInput.trim()) ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                  {saving ? (
                    <svg className="inline mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                  ) : (
                    <FaSave className="inline mr-2" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bio Modal */}
        {showEditBio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditBio(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Bio</h3>
                <button onClick={() => setShowEditBio(false)} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
              </div>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value.slice(0, MAX_BIO))}
                rows={5}
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <div className="text-xs text-gray-500 mb-2 text-right">{bioInput.length}/{MAX_BIO}</div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowEditBio(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={handleSaveBio} disabled={saving} className={`px-4 py-2 rounded text-white ${!saving ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                  {saving ? (
                    <svg className="inline mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                  ) : (
                    <FaSave className="inline mr-2" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowChangePassword(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Change Password</h3>
                <button onClick={() => setShowChangePassword(false)} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
              </div>
              <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
              <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border rounded mb-4" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowChangePassword(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={handleChangePassword} disabled={saving || !newPassword || newPassword !== confirmPassword} className={`px-4 py-2 rounded text-white ${(!saving && newPassword && newPassword === confirmPassword) ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                  <FaSave className="inline mr-2" /> Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Subscription Modal */}
        {showManageSubscription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowManageSubscription(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{subActive ? 'Manage Subscription' : 'Subscribe to Access'}</h3>
                <button onClick={() => setShowManageSubscription(false)} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Current Plan</span>
                  <span className="font-medium">Membership</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Billing Cycle</span>
                  <span>Monthly</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Amount</span>
                  <span>₦2,500</span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-2">
                {paystackError ? (
                  <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <p className="font-medium">Payment System Error</p>
                    <p>{paystackError}</p>
                    <p className="mt-1 text-xs">Please contact support or check your configuration.</p>
                  </div>
                ) : (
                <button
                  onClick={startSubscription}
                  disabled={!paystackReady || subActive}
                    className={`px-4 py-2 rounded-lg ${
                      paystackReady && !subActive 
                        ? 'bg-primary-600 text-white hover:bg-primary-700' 
                        : 'bg-gray-300 text-white cursor-not-allowed'
                    } border-0`}
                  >
                    {paystackReady 
                      ? (subActive ? 'Update subscription' : 'Subscribe Now') 
                      : 'Loading payment...'
                    }
                </button>
                )}
                <button
                  disabled={!subActive}
                  className={`px-4 py-2 border rounded-lg ${subActive ? 'hover:bg-red-50 text-red-600' : 'text-gray-400 cursor-not-allowed'} `}
                  onClick={() => { if (!subActive) return; setShowCancelFlow(true); setCancelStep(1); setCancelReason(''); setCancelOther(''); setCancelUnderstand(false); }}
                >
                  Cancel subscription
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Cancel Subscription Flow */}
        {showCancelFlow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCancelFlow(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Cancel Subscription</h3>
                <button onClick={() => setShowCancelFlow(false)} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
              </div>

              {cancelStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">We’re sorry to see you go. Please tell us why you’re canceling:</p>
                  <div className="space-y-2 text-sm">
                    {['Too expensive', 'Not using enough', 'Technical issues', 'Other'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2">
                        <input type="radio" name="cancel-reason" checked={cancelReason === opt} onChange={() => setCancelReason(opt)} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {cancelReason === 'Other' && (
                    <input
                      placeholder="Please share a brief reason"
                      value={cancelOther}
                      onChange={(e) => setCancelOther(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                  )}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCancelFlow(false)} className="px-4 py-2 border rounded">Back</button>
                    <button
                      onClick={() => setCancelStep(2)}
                      disabled={cancelReason === '' || (cancelReason === 'Other' && !cancelOther.trim())}
                      className={`px-4 py-2 rounded text-white ${cancelReason !== '' && (cancelReason !== 'Other' || cancelOther.trim()) ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {cancelStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">Before you cancel, please confirm:</p>
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={cancelUnderstand} onChange={(e) => setCancelUnderstand(e.target.checked)} />
                    <span>I understand my membership benefits will end at the close of my billing period.</span>
                  </label>
                  <div className="flex justify-between gap-2">
                    <button onClick={() => setCancelStep(1)} className="px-4 py-2 border rounded">Back</button>
                    <button
                      onClick={async () => {
                        try {
                          if (subscription?.paystack_subscription_id) {
                            // Use the real subscription service to cancel
                            const result = await subscriptionService.cancelSubscription(
                              subscription.id,
                              subscription.paystack_subscription_id
                            );
                            
                            if (result.success) {
                              setMessage('Subscription canceled successfully. You will retain access until the end of your current billing period.');
                              setSubActive(false);
                              // Update local subscription status
                              setSubscription(prev => prev ? { ...prev, status: 'canceled' } : null);
                            } else {
                              setError(result.message || 'Failed to cancel subscription. Please try again.');
                            }
                          } else {
                            // Fallback to localStorage for backward compatibility
                            localStorage.setItem('subscription_active', 'false');
                            localStorage.removeItem('subscription_ref');
                            localStorage.removeItem('subscription_next_renewal');
                            setSubActive(false);
                            setMessage('Subscription canceled. You will retain access until the end of your current billing period.');
                          }
                        } catch (error) {
                          console.error('Error canceling subscription:', error);
                          setError('Failed to cancel subscription. Please try again.');
                        }
                        setShowCancelFlow(false);
                        setShowManageSubscription(false);
                      }}
                      disabled={!cancelUnderstand}
                      className={`px-4 py-2 rounded text-white ${cancelUnderstand ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      Confirm Cancel
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Note: Subscription cancellation is now processed through our secure backend API and verified with Paystack.</p>
                </div>
              )}
            </div>
          </div>
        )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


