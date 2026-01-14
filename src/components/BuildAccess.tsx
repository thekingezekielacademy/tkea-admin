import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Interfaces
interface Profile {
  id: string;
  name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
}

// BUILD COMMUNITY course titles
const BUILD_COURSE_TITLES = [
  'FREELANCING - THE UNTAPPED MARKET',
  'INFORMATION MARKETING: THE INFINITE CASH LOOP',
  'YOUTUBE MONETIZATION: From Setup To Monetization',
  'EARN 500K SIDE INCOME SELLING EBOOKS',
  'CPA MARKETING BLUEPRINT: TKEA RESELLERS'
];

const BuildAccess: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [email, setEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState<Profile | null>(null);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');

  const [granting, setGranting] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [coursesGranted, setCoursesGranted] = useState<string[]>([]);
  const [emailSent, setEmailSent] = useState(false);

  // Admin check
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Lookup user by email
  const lookupUserByEmail = useCallback(async (emailAddress: string) => {
    try {
      setUserLoading(true);
      setUserError('');
      setSearchedUser(null);
      setIsGuestUser(false);

      const normalizedEmail = emailAddress.toLowerCase().trim();

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (profileError || !profile) {
        // User not found - treat as guest user
        setIsGuestUser(true);
        setSearchedUser(null);
        return;
      }

      // User found
      setSearchedUser(profile);
      setIsGuestUser(false);
    } catch (err: any) {
      console.error('Error looking up user:', err);
      setUserError('Failed to search for user. Please try again.');
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Find courses by title (case-insensitive partial match)
  const findCoursesByTitles = useCallback(async (titles: string[]): Promise<Course[]> => {
    try {
      const allCourses: Course[] = [];
      
      // Search for each title using ILIKE for partial matching
      for (const title of titles) {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('status', 'published')
          .ilike('title', `%${title}%`)
          .limit(1); // Get first match
        
        if (!error && data && data.length > 0) {
          allCourses.push(data[0]);
        }
      }
      
      return allCourses;
    } catch (err) {
      console.error('Error finding courses:', err);
      return [];
    }
  }, []);

  // Check for duplicate purchase
  const checkDuplicatePurchase = useCallback(async (
    userId: string | null,
    userEmail: string,
    courseId: string
  ): Promise<boolean> => {
    try {
      if (userId) {
        const { data } = await supabase
          .from('product_purchases')
          .select('id')
          .eq('buyer_id', userId)
          .eq('product_id', courseId)
          .eq('product_type', 'course')
          .maybeSingle();
        return !!data;
      } else {
        const { data } = await supabase
          .from('product_purchases')
          .select('id')
          .eq('buyer_email', userEmail)
          .eq('product_id', courseId)
          .eq('product_type', 'course')
          .maybeSingle();
        return !!data;
      }
    } catch (err) {
      return false;
    }
  }, []);

  // Generate access token
  const generateAccessToken = (): string => {
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    return Array.from(tokenArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Grant live class access
  // Note: live_class_id cannot be NULL, so we grant access to all active live classes individually
  const grantLiveClassAccess = useCallback(async (userId: string | null, userEmail: string) => {
    try {
      if (userId) {
        // Get all active live classes
        const { data: liveClasses, error: fetchError } = await supabase
          .from('live_classes')
          .select('id')
          .eq('is_active', true);

        if (fetchError) {
          console.error('Error fetching live classes:', fetchError);
          return;
        }

        if (liveClasses && liveClasses.length > 0) {
          // Create access record for each live class
          // Insert each one individually and ignore duplicates
          for (const liveClass of liveClasses) {
            const { error: insertError } = await supabase
              .from('live_class_access')
              .insert({
                user_id: userId,
                live_class_id: liveClass.id,
                access_type: 'full_course',
              });

            // Ignore duplicate errors (user already has access)
            if (insertError && 
                !insertError.message.includes('duplicate') && 
                !insertError.message.includes('UNIQUE') &&
                !insertError.code?.includes('23505')) { // PostgreSQL unique violation
              console.error('Error granting live class access:', insertError);
              // Don't throw - continue with other live classes
            }
          }
        }
      } else {
        // For guest users, live class access will be granted when they sign up
        console.log('Guest user live class access will be granted upon signup');
      }
    } catch (err) {
      console.error('Error in grantLiveClassAccess:', err);
      // Don't throw - continue even if this fails
    }
  }, []);

  // Create purchase record
  const createPurchaseRecord = useCallback(async (purchaseData: any) => {
    const { error } = await supabase
      .from('product_purchases')
      .insert(purchaseData);

    if (error) throw error;
  }, []);

  // Send BUILD access email
  const sendBuildEmail = useCallback(async (userEmail: string, userName: string) => {
    try {
      const siteUrl = process.env.REACT_APP_SITE_URL || 
                     process.env.REACT_APP_APP_URL || 
                     'https://app.thekingezekielacademy.com';

      const purchaseDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Use serverless function API (works from Vercel admin panel)
      // The api/ folder contains serverless functions that work from any origin
      // Always use the same origin to avoid CORS issues
      const apiUrl = `${window.location.origin}/api/send-build-access-emails`;
      console.log('[BuildAccess] Using API URL:', apiUrl);

      // Send BUILD COMMUNITY Access Email (includes career discovery info)
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailType: 'build_access',
            name: userName,
            email: userEmail,
            purchaseDate: purchaseDate,
            libraryLink: `${siteUrl}/library`,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setEmailSent(true);
            console.log('[BuildAccess] BUILD access email sent successfully');
          } else {
            console.error('[BuildAccess] Email API returned error:', result.error);
          }
        } else {
          const errorText = await response.text();
          console.error('[BuildAccess] Email API error response:', response.status, errorText);
        }
      } catch (emailErr) {
        console.error('[BuildAccess] Error sending BUILD access email:', emailErr);
      }
    } catch (err) {
      console.error('[BuildAccess] Error in sendBuildEmail:', err);
      // Don't throw - emails are not critical
    }
  }, []);

  // Grant BUILD access
  const grantBuildAccess = useCallback(async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setGranting(true);
      setError('');
      setSuccess(false);
      setCoursesGranted([]);
      setEmailSent(false);

      const userEmail = email.toLowerCase().trim();
      const userId = searchedUser?.id || null;
      const userName = searchedUser?.name || userEmail.split('@')[0];

      // 1. Find courses by title
      const courses = await findCoursesByTitles(BUILD_COURSE_TITLES);

      if (courses.length === 0) {
        throw new Error('No BUILD courses found. Please verify course titles in the database.');
      }

      // 2. Create purchase records for each course
      const grantedCourses: string[] = [];
      const paymentReference = `BUILD_ADMIN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      for (const course of courses) {
        // Check for duplicate
        const hasDuplicate = await checkDuplicatePurchase(userId, userEmail, course.id);

        if (!hasDuplicate) {
          const accessToken = generateAccessToken();

          await createPurchaseRecord({
            product_id: course.id,
            product_type: 'course',
            buyer_id: userId,
            buyer_email: userEmail,
            amount_paid: 1, // Minimum (1 kobo)
            purchase_price: 1, // Minimum (1 kobo) - required by check constraint
            payment_status: 'success',
            payment_reference: paymentReference,
            access_granted: true,
            access_granted_at: new Date().toISOString(),
            access_token: accessToken,
          });

          grantedCourses.push(course.title);
        }
      }

      // 3. Grant live class access
      await grantLiveClassAccess(userId, userEmail);

      // 3b. Create product_purchases record with product_type='live_class' for BUILD COMMUNITY access check
      // This is required for the /choose-skill page to recognize BUILD COMMUNITY access
      try {
        // Get first active live class ID to use as product_id
        const { data: liveClasses } = await supabase
          .from('live_classes')
          .select('id')
          .eq('is_active', true)
          .limit(1);

        if (liveClasses && liveClasses.length > 0) {
          const liveClassId = liveClasses[0].id;
          
          // Check if BUILD COMMUNITY purchase record already exists
          let buildCommunityQuery = supabase
            .from('product_purchases')
            .select('id')
            .eq('product_type', 'live_class')
            .eq('payment_status', 'success')
            .eq('access_granted', true);

          if (userId) {
            buildCommunityQuery = buildCommunityQuery.eq('buyer_id', userId);
          } else {
            buildCommunityQuery = buildCommunityQuery.eq('buyer_email', userEmail);
          }

          const { data: existingBuildPurchase } = await buildCommunityQuery.maybeSingle();

          // Only create if it doesn't exist
          if (!existingBuildPurchase) {
            const accessToken = generateAccessToken();
            await createPurchaseRecord({
              product_id: liveClassId,
              product_type: 'live_class',
              buyer_id: userId,
              buyer_email: userEmail,
              amount_paid: 1, // Minimum (1 kobo)
              purchase_price: 1, // Minimum (1 kobo) - required by check constraint
              payment_status: 'success',
              payment_reference: `BUILD_COMMUNITY_${paymentReference}`,
              access_granted: true,
              access_granted_at: new Date().toISOString(),
              access_token: accessToken,
            });
            console.log('[BuildAccess] Created BUILD COMMUNITY purchase record (product_type=live_class)');
          }
        } else {
          console.warn('[BuildAccess] No active live classes found - skipping BUILD COMMUNITY purchase record');
        }
      } catch (buildCommunityErr) {
        console.error('[BuildAccess] Error creating BUILD COMMUNITY purchase record:', buildCommunityErr);
        // Don't throw - continue even if this fails
      }

      // 4. Send email
      setSendingEmails(true);
      await sendBuildEmail(userEmail, userName);
      setSendingEmails(false);

      setCoursesGranted(grantedCourses);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error granting BUILD access:', err);
      setError(err.message || 'Failed to grant BUILD access');
    } finally {
      setGranting(false);
      setSendingEmails(false);
    }
  }, [email, searchedUser, findCoursesByTitles, checkDuplicatePurchase, createPurchaseRecord, grantLiveClassAccess, sendBuildEmail]);

  // Handle search user
  const handleSearchUser = () => {
    if (!email || !email.includes('@')) {
      setUserError('Please enter a valid email address');
      return;
    }
    lookupUserByEmail(email);
  };

  // Reset form
  const resetForm = () => {
    setEmail('');
    setSearchedUser(null);
    setIsGuestUser(false);
    setSuccess(false);
    setError('');
    setCoursesGranted([]);
    setEmailSent(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">B.U.I.L.D Access</h1>
            <p className="text-gray-600">Grant B.U.I.L.D COMMUNITY bundle access to users by email</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold">Success! B.U.I.L.D Access granted.</p>
                  <div className="mt-2 text-sm">
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Courses Granted:</strong> {coursesGranted.length}</p>
                    {coursesGranted.length > 0 && (
                      <ul className="list-disc list-inside mt-1 ml-2">
                        {coursesGranted.map((title, idx) => (
                          <li key={idx} className="text-xs">{title}</li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2"><strong>Live Classes:</strong> ✓ Access granted</p>
                    <p className="mt-2"><strong>Email Sent:</strong> {emailSent ? '✓ Sent' : '✗ Failed'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: User Email Lookup */}
          {!success && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Find User</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter User Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                      placeholder="user@example.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      onClick={handleSearchUser}
                      disabled={userLoading || !email}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {userLoading ? 'Searching...' : 'Search User'}
                    </button>
                  </div>
                  {userError && (
                    <p className="mt-2 text-sm text-red-600">{userError}</p>
                  )}
                </div>

                {/* User Info Display */}
                {(searchedUser || isGuestUser) && !userLoading && (
                  <div className={`p-4 rounded-lg border-2 ${isGuestUser ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    {isGuestUser ? (
                      <div>
                        <div className="flex items-center mb-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-200 text-yellow-800 mr-2">
                            New User (Guest)
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          <strong>Email:</strong> {email}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Access will be connected when they sign up/sign in with this email.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center mb-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-green-200 text-green-800 mr-2">
                            Existing User
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          <strong>Name:</strong> {searchedUser?.name}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Email:</strong> {searchedUser?.email}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Bundle Display */}
          {(searchedUser || isGuestUser) && !success && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Review Bundle</h2>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-4">🎯 B.U.I.L.D COMMUNITY BUNDLE</h3>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📚 Courses Included:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {BUILD_COURSE_TITLES.map((title, idx) => (
                      <li key={idx}>{idx + 1}. {title}</li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-purple-300 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🎥 Live Classes:</h4>
                  <p className="text-sm text-gray-700">✓ Access to ALL live classes</p>
                </div>
              </div>
            </div>
          )}

          {/* Grant Access Button */}
          {(searchedUser || isGuestUser) && !success && (
            <div className="flex gap-4">
              <button
                onClick={grantBuildAccess}
                disabled={granting || sendingEmails}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {granting ? 'Granting Access...' : sendingEmails ? 'Sending Emails...' : 'Grant B.U.I.L.D Access'}
              </button>
            </div>
          )}

          {/* Success Actions */}
          {success && (
            <div className="flex gap-4 mt-6">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Grant Another Access
              </button>
              <button
                onClick={() => navigate('/admin/purchases')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                View Purchases
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildAccess;
