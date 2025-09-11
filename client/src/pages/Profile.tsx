import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { supabase } from '../lib/supabase';
import secureStorage from '../utils/secureStorage';
import DashboardSidebar from '../components/DashboardSidebar';
import { FaEdit, FaEnvelope, FaImage, FaKey, FaSave, FaTimes, FaCreditCard, FaHistory } from 'react-icons/fa';


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
  // Billing history only
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
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
  
  // Fetch billing history only
  const fetchBillingHistory = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setBillingLoading(true);
      
      // Fetch billing history
        const { data: billingData, error: billingError } = await supabase
          .from('subscription_payments')
          .select('*')
          .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (billingError) {
        console.error('Error fetching billing history:', billingError);
        } else {
        setBillingHistory(billingData || []);
        console.log('✅ Billing history fetched:', billingData?.length || 0, 'records');
      }
    } catch (error) {
      console.error('Error in billing history fetch:', error);
    } finally {
      setBillingLoading(false);
    }
  }, [user?.id]);

  // Fetch billing history when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchBillingHistory();
    }
  }, [user?.id, fetchBillingHistory]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
        return;
      }
      
    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      await fetchProfile();
      setMessage('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: nameInput.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      await fetchProfile();
      setShowEditName(false);
      setMessage('Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      setError('Failed to update name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBio = async () => {
    if (bioInput.length > MAX_BIO) {
      setError(`Bio must be less than ${MAX_BIO} characters`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: bioInput.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      await fetchProfile();
      setShowEditBio(false);
      setMessage('Bio updated successfully!');
    } catch (error) {
      console.error('Error updating bio:', error);
      setError('Failed to update bio. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      
      <div className={`transition-all duration-300 ${getSidebarMargin()}`}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>
            
            {/* Success/Error Messages */}
            {message && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {message}
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              
            {/* Avatar */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="relative">
                  <img
                    src={user?.avatar_url || '/img/default-avatar.png'}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FaImage className="w-3 h-3" />
                  </button>
                  </div>
                <div>
                  <p className="text-sm text-gray-600">Profile Picture</p>
                  <p className="text-xs text-gray-500">Click the camera icon to upload</p>
                </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                accept="image/*"
                onChange={handleImageUpload}
                    className="hidden"
              />

              {/* Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                {showEditName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <FaSave className="w-4 h-4" />
                  </button>
                    <button
                      onClick={() => {
                        setShowEditName(false);
                        setNameInput(user?.name || '');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      <FaTimes className="w-4 h-4" />
                </button>
              </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900">{user?.name || 'No name set'}</span>
                    <button
                      onClick={() => setShowEditName(true)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <FaEdit className="w-4 h-4" />
                </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center space-x-2">
                  <FaEnvelope className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{user?.email}</span>
              </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {showEditBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about yourself..."
                      maxLength={MAX_BIO}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {bioInput.length}/{MAX_BIO} characters
                      </span>
                      <div className="space-x-2">
                        <button
                          onClick={handleSaveBio}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          <FaSave className="w-4 h-4" />
            </button>
            <button
                          onClick={() => {
                            setShowEditBio(false);
                            setBioInput(user?.bio || '');
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          <FaTimes className="w-4 h-4" />
            </button>
          </div>
              </div>
            </div>
            ) : (
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-900 flex-1">{user?.bio || 'No bio set'}</span>
                    <button
                      onClick={() => setShowEditBio(true)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
              </div>
            )}
          </div>

              {/* Change Password */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                {showChangePassword ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                      />
          </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                      />
          </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        <FaKey className="w-4 h-4" />
                </button>
                      <button
                        onClick={() => {
                          setShowChangePassword(false);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        <FaTimes className="w-4 h-4" />
                </button>
                </div>
                  </div>
                ) : (
                <button
                    onClick={() => setShowChangePassword(true)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <FaKey className="w-4 h-4" />
                    <span>Change Password</span>
                </button>
                )}
              </div>
            </div>

            {/* Subscription Management - Moved to /subscription page */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription</h2>
              <div className="text-center py-8">
                <FaCreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Your Subscription</h3>
                <p className="text-gray-600 mb-6">Go to the subscription page to manage your plan</p>
                <a
                  href="/subscription"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Subscription Page
                </a>
          </div>
              </div>

            {/* Billing History */}
            {billingHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing History</h2>
                <div className="space-y-4">
                  {billingHistory.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FaHistory className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(payment.paid_at)}
                          </p>
                  </div>
                </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600 capitalize">
                          {payment.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.payment_method}
                        </p>
                  </div>
                </div>
                  ))}
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