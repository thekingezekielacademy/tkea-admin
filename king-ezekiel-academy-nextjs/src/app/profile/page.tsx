'use client'
import React, { useState, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { FaEdit, FaEnvelope, FaImage, FaKey, FaSave, FaTimes, FaTrash, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const Profile: React.FC = () => {
  const { user, fetchProfile, signOut } = useAuth();

  const [showEditName, setShowEditName] = useState(false);
  const [showEditBio, setShowEditBio] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteAnswers, setDeleteAnswers] = useState({
    reason: '',
    feedback: '',
    confirm: false
  });

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

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    
    setSaving(true);
    try {
      // Update name logic here
      setMessage('Name updated successfully!');
      setShowEditName(false);
    } catch (err) {
      setError('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      // Update bio logic here
      setMessage('Bio updated successfully!');
      setShowEditBio(false);
    } catch (err) {
      setError('Failed to update bio');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setSaving(true);
    try {
      // Change password logic here
      setMessage('Password changed successfully!');
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
    } else if (deleteStep === 2) {
      if (!deleteAnswers.confirm) {
        setError('Please confirm you want to delete your account');
        return;
      }
      
      setSaving(true);
      try {
        // Delete account logic here
        await signOut();
        // Navigation is handled by the onSignOut callback in AuthContext
      } catch (err) {
        setError('Failed to delete account');
        setSaving(false);
      }
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="p-6">
      {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">
              Profile Settings
            </h1>
            <p className="text-primary-600">
              Manage your account information and preferences
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
              <FaCheckCircle className="h-5 w-5 mr-2" />
              {message}
        </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
              <FaTimesCircle className="h-5 w-5 mr-2" />
              {error}
      </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-6 mb-6">
                <h2 className="text-xl font-semibold text-primary-900 mb-6">Profile Information</h2>
                
                {/* Profile Picture */}
                <div className="flex items-center space-x-6 mb-6">
                  <div className="relative">
                    <img
                      src={user?.avatar_url || '/img/default-avatar.jpg'}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FaImage className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={() => {/* Handle file upload */}}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900">{user?.name || 'User'}</h3>
                    <p className="text-primary-600">{user?.email}</p>
                  </div>
                </div>

                {/* Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-primary-700 mb-2">Full Name</label>
                  {showEditName ? (
                    <div className="flex items-center space-x-2">
                    <input
                      type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter your full name"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={saving || !nameInput.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaSave className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowEditName(false);
                          setNameInput(user?.name || '');
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        <FaTimes className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-primary-900">{user?.name || 'Not set'}</span>
                      <button
                        onClick={() => setShowEditName(true)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-primary-700 mb-2">Bio</label>
                  {showEditBio ? (
                <div>
                      <textarea
                        value={bioInput}
                        onChange={(e) => setBioInput(e.target.value)}
                        maxLength={MAX_BIO}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Tell us about yourself..."
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">
                          {bioInput.length}/{MAX_BIO} characters
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveBio}
                            disabled={saving}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                          >
                            <FaSave className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setShowEditBio(false);
                              setBioInput(user?.bio || '');
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            <FaTimes className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-primary-900 flex-1">{user?.bio || 'No bio added yet'}</p>
                      <button
                        onClick={() => setShowEditBio(true)}
                        className="text-primary-600 hover:text-primary-700 ml-4"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-6">
                <h2 className="text-xl font-semibold text-primary-900 mb-6">Security Settings</h2>

                {/* Change Password */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                <div>
                      <h3 className="font-medium text-primary-900">Password</h3>
                      <p className="text-sm text-primary-600">Change your account password</p>
                    </div>
                    <button
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <FaKey className="h-4 w-4" />
                    </button>
                </div>

                  {showChangePassword && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-2">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter new password"
                        />
                      </div>
                <div>
                        <label className="block text-sm font-medium text-primary-700 mb-2">Confirm Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handlePasswordChange}
                          disabled={saving || !newPassword || !confirmPassword}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'Changing...' : 'Change Password'}
                        </button>
                        <button
                          onClick={() => {
                            setShowChangePassword(false);
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-6">
                <h2 className="text-xl font-semibold text-primary-900 mb-6">Account Actions</h2>
                
                <div className="space-y-4">
                  <button
                    onClick={() => setShowDeleteAccount(true)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTrash className="h-4 w-4 mr-2" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
            </div>

          {/* Delete Account Modal */}
          {showDeleteAccount && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                <div className="text-center mb-6">
                  <FaExclamationTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-primary-900 mb-2">
                    {deleteStep === 1 ? 'Delete Account' : 'Confirm Deletion'}
                  </h3>
                  <p className="text-primary-600">
                    {deleteStep === 1 
                      ? 'This action cannot be undone. Are you sure you want to delete your account?'
                      : 'Please confirm your decision to delete your account.'
                    }
                  </p>
                    </div>

                {deleteStep === 2 && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-2">Reason for leaving</label>
                      <select
                        value={deleteAnswers.reason}
                        onChange={(e) => setDeleteAnswers({...deleteAnswers, reason: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select a reason</option>
                        <option value="not-useful">Not useful</option>
                        <option value="too-expensive">Too expensive</option>
                        <option value="found-alternative">Found alternative</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-2">Additional feedback</label>
                      <textarea
                        value={deleteAnswers.feedback}
                        onChange={(e) => setDeleteAnswers({...deleteAnswers, feedback: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Tell us how we can improve..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="confirm"
                        checked={deleteAnswers.confirm}
                        onChange={(e) => setDeleteAnswers({...deleteAnswers, confirm: e.target.checked})}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="confirm" className="ml-2 text-sm text-primary-700">
                        I understand this action cannot be undone
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={saving || (deleteStep === 2 && !deleteAnswers.confirm)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Deleting...' : deleteStep === 1 ? 'Continue' : 'Delete Account'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteAccount(false);
                      setDeleteStep(1);
                      setDeleteAnswers({ reason: '', feedback: '', confirm: false });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
};

export default Profile;
