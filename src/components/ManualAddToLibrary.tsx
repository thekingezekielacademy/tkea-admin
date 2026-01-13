import React, { useState, useEffect, useCallback } from 'react';
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
  description?: string;
  cover_photo_url?: string;
  purchase_price?: number;
  level?: string;
  category?: string;
}

interface LearningPath {
  id: string;
  title: string;
  description?: string;
  cover_photo_url?: string;
  purchase_price?: number;
  level?: string;
  category?: string;
}

interface Purchase {
  id: string;
  buyer_id: string | null;
  buyer_email: string | null;
  product_id: string;
  product_type: 'course' | 'learning_path';
  amount_paid: number;
  purchase_price: number;
  payment_status: string;
  access_granted: boolean;
  created_at: string;
}

const ManualAddToLibrary: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [email, setEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState<Profile | null>(null);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');

  const [productType, setProductType] = useState<'course' | 'learning_path'>('course');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Course | LearningPath | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [availableLearningPaths, setAvailableLearningPaths] = useState<LearningPath[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [adding, setAdding] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [addedPurchase, setAddedPurchase] = useState<Purchase | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Admin check
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      // Will show access denied in render
    }
  }, [user]);

  // Fetch products when product type changes
  useEffect(() => {
    if (productType === 'course') {
      fetchCourses();
    } else {
      fetchLearningPaths();
    }
  }, [productType]);

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
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when not found

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

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, cover_photo_url, purchase_price, level, category')
        .eq('status', 'published')
        .order('title');

      if (error) throw error;
      setAvailableCourses(data || []);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Fetch learning paths
  const fetchLearningPaths = useCallback(async () => {
    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('learning_paths')
        .select('id, title, description, cover_photo_url, purchase_price, level, category')
        .eq('status', 'published')
        .order('title');

      if (error) throw error;
      setAvailableLearningPaths(data || []);
    } catch (err: any) {
      console.error('Error fetching learning paths:', err);
      setError('Failed to load learning paths');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Check for duplicate purchase
  const checkExistingPurchase = useCallback(async (): Promise<boolean> => {
    if (!email || !selectedProductId) return false;

    const normalizedEmail = email.toLowerCase().trim();

    try {
      if (isGuestUser || !searchedUser) {
        // Check by email for guest
        const { data } = await supabase
          .from('product_purchases')
          .select('id')
          .eq('buyer_email', normalizedEmail)
          .eq('product_id', selectedProductId)
          .eq('product_type', productType)
          .maybeSingle(); // Use maybeSingle to avoid error when not found

        return !!data;
      } else {
        // Check by buyer_id for existing user
        const { data } = await supabase
          .from('product_purchases')
          .select('id')
          .eq('buyer_id', searchedUser.id)
          .eq('product_id', selectedProductId)
          .eq('product_type', productType)
          .maybeSingle(); // Use maybeSingle to avoid error when not found

        return !!data;
      }
    } catch (err) {
      // No existing purchase found
      return false;
    }
  }, [email, selectedProductId, productType, isGuestUser, searchedUser]);

  // Add to library
  const addToLibrary = useCallback(async () => {
    if (!email || !selectedProductId || !selectedProduct) {
      setError('Please select a product and enter an email');
      return;
    }

    try {
      setAdding(true);
      setError('');
      setSuccess(false);

      const userEmail = email.toLowerCase().trim();
      const rawProductPrice = selectedProduct.purchase_price || 0;
      const productPrice = normalizeAmount(rawProductPrice); // Normalize from kobo to naira

      // Check for duplicate
      const hasDuplicate = await checkExistingPurchase();
      if (hasDuplicate) {
        const proceed = window.confirm(
          'User already has access to this product. Do you want to add it anyway?'
        );
        if (!proceed) return;
      }

      // Prepare purchase data
      // Generate a unique payment reference for manual grants
      const paymentReference = `ADMIN_MANUAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate access token (64-character hex string, same as webhook)
      // Using Web Crypto API to generate 32 random bytes, then convert to hex
      const tokenArray = new Uint8Array(32);
      crypto.getRandomValues(tokenArray);
      const accessToken = Array.from(tokenArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Store amounts in kobo for consistency with real purchases
      // amount_paid must be > 0 based on check constraint
      // Convert naira to kobo: multiply by 100 (e.g., 2500 naira = 250000 kobo)
      const amountPaidInKobo = productPrice > 0 ? Math.round(productPrice * 100) : 1; // Use 1 kobo as minimum if free product
      const purchasePriceInKobo = Math.round(productPrice * 100);
      
      const purchaseData: any = {
        product_id: selectedProductId,
        product_type: productType,
        amount_paid: amountPaidInKobo, // Store in kobo for consistency
        purchase_price: purchasePriceInKobo, // Store in kobo for consistency
        payment_status: 'success',
        payment_reference: paymentReference, // Required field
        access_granted: true,
        access_granted_at: new Date().toISOString(),
        access_token: accessToken, // Store access token for secure access link
      };

      // Set buyer information
      if (isGuestUser || !searchedUser) {
        purchaseData.buyer_email = userEmail;
        purchaseData.buyer_id = null;
      } else {
        purchaseData.buyer_id = searchedUser.id;
        purchaseData.buyer_email = userEmail;
      }

      // Insert purchase record
      const { data: purchase, error: insertError } = await supabase
        .from('product_purchases')
        .insert(purchaseData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Send purchase access email via API route (no CORS issues)
      setSendingEmail(true);
      try {
        // Use the actual site URL, not the admin panel URL
        const siteUrl = process.env.REACT_APP_SITE_URL || 
                       process.env.REACT_APP_APP_URL || 
                       'https://app.thekingezekielacademy.com';
        
        // Generate access link with purchase ID and token (same format as webhook)
        const accessLink =
          productType === 'course'
            ? `${siteUrl}/course/${selectedProductId}/overview?purchase=${purchase.id}&token=${accessToken}`
            : `${siteUrl}/access/${purchase.id}?token=${accessToken}`;

        // Format purchase date
        const purchaseDate = new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Call local API route (no CORS issues - same origin)
        // Use full URL to ensure it works on mobile devices
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/send-purchase-access-email`;
        console.log('[ManualAddToLibrary] Sending email request:', { 
          apiUrl, 
          baseUrl,
          email: userEmail, 
          courseName: selectedProduct.title,
          userAgent: navigator.userAgent 
        });
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: searchedUser?.name || 'Valued Student',
            email: userEmail,
            courseName: selectedProduct.title,
            purchasePrice: purchasePriceInKobo, // Already in kobo
            purchaseDate: purchaseDate,
            accessLink: accessLink,
            purchaseId: purchase.id,
          }),
        });

        // Check if response is ok before parsing JSON
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ManualAddToLibrary] API error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          setEmailSent(false);
          throw new Error(`Email API error: ${response.status} ${response.statusText}`);
        }

        // Parse JSON response
        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('[ManualAddToLibrary] Failed to parse JSON response:', parseError);
          setEmailSent(false);
          throw new Error('Invalid response from email API');
        }

        console.log('[ManualAddToLibrary] Email API response:', result);

        if (result.success) {
          setEmailSent(true);
          console.log('[ManualAddToLibrary] Purchase access email sent successfully');
        } else {
          setEmailSent(false);
          const errorMsg = result.error || result.message || 'Unknown error';
          console.warn('[ManualAddToLibrary] Failed to send purchase access email:', errorMsg);
          throw new Error(errorMsg);
        }
      } catch (emailErr: any) {
        console.error('[ManualAddToLibrary] Error sending email:', emailErr);
        setEmailSent(false);
        // Show error to user but don't block purchase success
        const errorMessage = emailErr.message || 'Failed to send email. Purchase was added successfully.';
        console.warn('[ManualAddToLibrary] Email sending failed:', errorMessage);
        // You could optionally show a toast/notification here
      } finally {
        setSendingEmail(false);
      }

      setSuccess(true);
      setAddedPurchase(purchase);
    } catch (err: any) {
      console.error('Error adding to library:', err);
      setError(err.message || 'Failed to add product to library');
    } finally {
      setAdding(false);
    }
  }, [email, selectedProductId, selectedProduct, productType, isGuestUser, searchedUser, checkExistingPurchase]);

  // Handle product selection
  const handleProductSelect = useCallback((product: Course | LearningPath) => {
    setSelectedProductId(product.id);
    setSelectedProduct(product);
  }, []);

  // Filter products by search term
  const filteredProducts = (productType === 'course' ? availableCourses : availableLearningPaths).filter(
    (product) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        product.title.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        false
      );
    }
  );

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
    setSelectedProductId(null);
    setSelectedProduct(null);
    setSuccess(false);
    setError('');
    setEmailSent(false);
    setAddedPurchase(null);
  };

  // Normalize amount (handle both kobo and naira formats)
  const normalizeAmount = useCallback((raw: number) => {
    if (typeof raw !== 'number' || isNaN(raw)) return 0;
    
    // If amount is >= 100000, it's likely in kobo (250000 kobo = 2500 naira)
    if (raw >= 100000 && raw % 100 === 0) {
      return Math.round(raw / 100);
    }
    
    // If amount is between 100 and 10000, it's likely already in naira (keep as-is)
    // Common course price: 2500 naira
    if (raw >= 100 && raw < 10000) {
      return raw;
    }
    
    // If amount is very small (< 100), might be legacy divide (e.g., 25 → 2500)
    if (raw > 0 && raw < 100) {
      return raw * 100; // fix legacy 25 → 2500
    }
    
    // Default: keep as-is
    return raw;
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    const normalized = normalizeAmount(amount);
    return `₦${normalized.toLocaleString('en-NG')}`;
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manual Add to Library</h1>
            <p className="text-gray-600">Add courses and learning paths to a user's library by email</p>
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
                <div>
                  <p className="font-semibold">Success! Product added to library.</p>
                  <p className="text-sm mt-1">
                    {selectedProduct?.title} has been added to {searchedUser?.name || email}'s library.
                  </p>
                  {emailSent && (
                    <p className="text-sm mt-1">
                      ✓ Purchase confirmation email sent to {email}
                    </p>
                  )}
                  {!emailSent && (
                    <p className="text-sm mt-1 text-yellow-600">
                      ⚠ Purchase added but email failed to send
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: User Email Lookup */}
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSearchUser}
                    disabled={userLoading || !email}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        Purchase will be connected when they sign up/sign in with this email.
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

          {/* Step 2: Product Selection */}
          {(searchedUser || isGuestUser) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Select Product</h2>

              {/* Product Type Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="productType"
                      value="course"
                      checked={productType === 'course'}
                      onChange={(e) => setProductType(e.target.value as 'course')}
                      className="mr-2"
                    />
                    Course
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="productType"
                      value="learning_path"
                      checked={productType === 'learning_path'}
                      onChange={(e) => setProductType(e.target.value as 'learning_path')}
                      className="mr-2"
                    />
                    Learning Path
                  </label>
                </div>
              </div>

              {/* Search Products */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder={`Search ${productType === 'course' ? 'courses' : 'learning paths'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Products List */}
              {productsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No {productType === 'course' ? 'courses' : 'learning paths'} found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto mb-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedProductId === product.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {product.cover_photo_url && (
                        <img
                          src={product.cover_photo_url}
                          alt={product.title}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className="font-semibold text-gray-900 mb-1">{product.title}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {product.purchase_price ? formatCurrency(product.purchase_price) : 'Free'}
                        </span>
                        {product.level && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {product.level}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Product Display */}
              {selectedProduct && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Selected Product:</h3>
                  <p className="text-gray-700">{selectedProduct.title}</p>
                  {selectedProduct.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedProduct.description}</p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedProductId(null);
                    }}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Change Selection
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add to Library Button */}
          {selectedProduct && (searchedUser || isGuestUser) && !success && (
            <div className="flex gap-4">
              <button
                onClick={addToLibrary}
                disabled={adding || sendingEmail}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {adding ? 'Adding...' : sendingEmail ? 'Sending Email...' : 'Add to Library'}
              </button>
            </div>
          )}

          {/* Success Actions */}
          {success && (
            <div className="flex gap-4 mt-6">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Add Another Product
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

export default ManualAddToLibrary;

