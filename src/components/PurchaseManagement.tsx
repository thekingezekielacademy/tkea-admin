import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Purchase {
  id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  product_id: string;
  product_type: 'course' | 'learning_path';
  product_name: string;
  amount_paid: number;
  purchase_price: number;
  payment_status: 'success' | 'failed' | 'pending';
  access_granted: boolean;
  access_granted_at: string | null;
  created_at: string;
  browser_fingerprint?: string;
}

const PurchaseManagement: React.FC = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProductType, setFilterProductType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalRevenue: 0,
    coursePurchases: 0,
    learningPathPurchases: 0,
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPurchases();
    }
  }, [user, filterProductType, filterStatus]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query - fetch purchases without foreign key join
      let query = supabase
        .from('product_purchases')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filterProductType !== 'all') {
        query = query.eq('product_type', filterProductType);
      }

      if (filterStatus !== 'all') {
        query = query.eq('payment_status', filterStatus);
      }

      const { data: purchasesData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch product names and buyer profiles
      const enrichedPurchases = await Promise.all(
        (purchasesData || []).map(async (purchase: any) => {
          let productName = 'Unknown Product';
          let buyerName = 'Unknown User';
          let buyerEmail = 'No Email';

          // Fetch buyer profile if buyer_id exists
          if (purchase.buyer_id) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('name, email')
                .eq('id', purchase.buyer_id)
                .single();
              
              if (profileData) {
                buyerName = profileData.name || 'Unknown User';
                buyerEmail = profileData.email || 'No Email';
              }
            } catch (err) {
              console.error('Error fetching buyer profile:', err);
            }
          }

          // Fetch product name
          try {
            if (purchase.product_type === 'course') {
              const { data: courseData } = await supabase
                .from('courses')
                .select('title')
                .eq('id', purchase.product_id)
                .single();
              productName = courseData?.title || 'Course Not Found';
            } else if (purchase.product_type === 'learning_path') {
              const { data: pathData } = await supabase
                .from('learning_paths')
                .select('title')
                .eq('id', purchase.product_id)
                .single();
              productName = pathData?.title || 'Learning Path Not Found';
            }
          } catch (err) {
            console.error('Error fetching product name:', err);
          }

          return {
            id: purchase.id,
            buyer_id: purchase.buyer_id,
            buyer_name: buyerName,
            buyer_email: buyerEmail,
            product_id: purchase.product_id,
            product_type: purchase.product_type,
            product_name: productName,
            amount_paid: purchase.amount_paid || 0,
            purchase_price: purchase.purchase_price || 0,
            payment_status: purchase.payment_status,
            access_granted: purchase.access_granted || false,
            access_granted_at: purchase.access_granted_at,
            created_at: purchase.created_at,
            browser_fingerprint: purchase.browser_fingerprint,
          };
        })
      );

      setPurchases(enrichedPurchases);

      // Normalize amount (handles both kobo and naira formats)
      const normalizeAmount = (raw: number): number => {
        if (typeof raw !== 'number' || isNaN(raw) || raw === 0) return 0;
        
        // If amount is >= 100000, it's likely in kobo (250000 kobo = 2500 naira)
        if (raw >= 100000 && raw % 100 === 0) {
          return Math.round(raw / 100);
        }
        
        // If amount is between 100 and 10000, it's likely already in naira (keep as-is)
        if (raw >= 100 && raw < 10000) {
          return raw;
        }
        
        // If amount is very small (< 100), might be legacy divide
        if (raw > 0 && raw < 100) {
          return raw * 100;
        }
        
        // For amounts between 10000 and 100000, check if divisible by 100
        if (raw >= 10000 && raw < 100000 && raw % 100 === 0) {
          return raw / 100;
        }
        
        // Default: convert from kobo if very large
        if (raw >= 100000) {
          return Math.round(raw / 100);
        }
        
        return raw;
      };

      // Calculate statistics
      const successfulPurchases = enrichedPurchases.filter(
        p => p.payment_status === 'success'
      );
      const totalRevenue = successfulPurchases.reduce(
        (sum, p) => sum + normalizeAmount(p.amount_paid || 0),
        0
      );
      const coursePurchases = enrichedPurchases.filter(
        p => p.product_type === 'course' && p.payment_status === 'success'
      ).length;
      const learningPathPurchases = enrichedPurchases.filter(
        p => p.product_type === 'learning_path' && p.payment_status === 'success'
      ).length;

      setStats({
        totalPurchases: successfulPurchases.length,
        totalRevenue,
        coursePurchases,
        learningPathPurchases,
      });
    } catch (err: any) {
      console.error('Error fetching purchases:', err);
      setError('Failed to load purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('product_purchases')
        .update({
          access_granted: true,
          access_granted_at: new Date().toISOString(),
        })
        .eq('id', purchaseId);

      if (error) throw error;

      // Refresh purchases
      fetchPurchases();
    } catch (err: any) {
      console.error('Error granting access:', err);
      alert('Failed to grant access. Please try again.');
    }
  };

  const handleRevokeAccess = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('product_purchases')
        .update({
          access_granted: false,
          access_granted_at: null,
        })
        .eq('id', purchaseId);

      if (error) throw error;

      // Refresh purchases
      fetchPurchases();
    } catch (err: any) {
      console.error('Error revoking access:', err);
      alert('Failed to revoke access. Please try again.');
    }
  };

  // Filter purchases by search term
  const filteredPurchases = purchases.filter(purchase => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      purchase.product_name.toLowerCase().includes(searchLower) ||
      purchase.buyer_name.toLowerCase().includes(searchLower) ||
      purchase.buyer_email.toLowerCase().includes(searchLower)
    );
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading purchases...
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Management</h1>
          <p className="text-gray-600">View and manage all course and learning path purchases</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600">Total Purchases</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPurchases}</p>
            <p className="text-xs text-gray-500 mt-1">Successful payments</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">From all purchases</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600">Course Purchases</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.coursePurchases}</p>
            <p className="text-xs text-gray-500 mt-1">Individual courses</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600">Learning Path Purchases</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.learningPathPurchases}</p>
            <p className="text-xs text-gray-500 mt-1">Path bundles</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by product, buyer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
              <select
                value={filterProductType}
                onChange={(e) => setFilterProductType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="course">Courses</option>
                <option value="learning_path">Learning Paths</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No purchases found
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(purchase.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{purchase.buyer_name}</div>
                        <div className="text-sm text-gray-500">{purchase.buyer_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {purchase.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          purchase.product_type === 'course'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {purchase.product_type === 'course' ? 'Course' : 'Learning Path'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(purchase.amount_paid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          purchase.payment_status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : purchase.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {purchase.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          purchase.access_granted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {purchase.access_granted ? 'Granted' : 'Not Granted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {purchase.payment_status === 'success' && (
                          <div className="flex space-x-2">
                            {!purchase.access_granted ? (
                              <button
                                onClick={() => handleGrantAccess(purchase.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Grant Access
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRevokeAccess(purchase.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Revoke Access
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseManagement;

