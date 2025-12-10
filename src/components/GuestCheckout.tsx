import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { setGuestEmail, getGuestEmail } from '../utils/courseAccess';

interface GuestCheckoutProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const GuestCheckout: React.FC<GuestCheckoutProps> = ({
  courseId,
  courseTitle,
  coursePrice,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(getGuestEmail() || '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already has this course
      const { data: existingPurchase } = await supabase
        .from('product_purchases')
        .select('id')
        .eq('product_id', courseId)
        .eq('product_type', 'course')
        .eq('buyer_email', normalizedEmail)
        .eq('payment_status', 'success')
        .maybeSingle();

      if (existingPurchase) {
        throw new Error('You already have access to this course. Please sign in to access it.');
      }

      // Store guest email for later linking
      setGuestEmail(normalizedEmail);

      // Generate payment reference
      const paymentReference = `GUEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create pending purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('product_purchases')
        .insert({
          product_id: courseId,
          product_type: 'course',
          buyer_email: normalizedEmail,
          buyer_id: null, // Guest purchase
          purchase_price: coursePrice,
          amount_paid: 0, // Will be updated after payment
          payment_status: 'pending',
          payment_reference: paymentReference,
          access_granted: false, // Will be granted after successful payment
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Redirect to payment page with purchase info
      // Store purchase ID in session for payment callback
      sessionStorage.setItem('pending_purchase_id', purchase.id);
      sessionStorage.setItem('pending_purchase_email', normalizedEmail);

      // For now, we'll use a simple payment flow
      // In production, integrate with your payment provider (Flutterwave, Paystack, etc.)
      // For demo purposes, we'll simulate payment success
      alert(`Payment integration needed. Purchase ID: ${purchase.id}\n\nIn production, redirect to payment gateway here.`);

      // TODO: Integrate with payment gateway
      // After successful payment, update the purchase record:
      // - Set payment_status = 'success'
      // - Set amount_paid = actual amount paid
      // - Set access_granted = true
      // - Set access_granted_at = NOW()

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/course/${courseId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Checkout as Guest</h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-1">{courseTitle}</h3>
          <p className="text-2xl font-bold text-indigo-600">₦{coursePrice.toLocaleString('en-NG')}</p>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your.email@example.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              We'll send your purchase confirmation and access link to this email
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="+234 800 000 0000"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> If you sign up later with this email, your purchase will automatically be linked to your account!
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : `Pay ₦${coursePrice.toLocaleString('en-NG')}`}
            </button>
          </div>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Already have an account? Sign in instead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestCheckout;
