import { supabase } from '../lib/supabase';

/**
 * Check if a user has access to a course
 * Supports both authenticated users (by buyer_id) and guest users (by buyer_email)
 */
export async function checkCourseAccess(
  courseId: string,
  userId?: string | null,
  userEmail?: string | null
): Promise<boolean> {
  try {
    // First, check if course is free
    const { data: course } = await supabase
      .from('courses')
      .select('access_type')
      .eq('id', courseId)
      .single();

    if (course?.access_type === 'free') {
      return true; // Free courses are accessible to everyone
    }

    // Check for purchase access
    let purchaseQuery = supabase
      .from('product_purchases')
      .select('id')
      .eq('product_id', courseId)
      .eq('product_type', 'course')
      .eq('payment_status', 'success')
      .eq('access_granted', true);

    // Check by buyer_id if user is authenticated
    if (userId) {
      const { data: purchaseByUserId } = await purchaseQuery
        .eq('buyer_id', userId)
        .maybeSingle();

      if (purchaseByUserId) {
        return true;
      }
    }

    // Check by buyer_email (for guest users or as fallback)
    if (userEmail) {
      const normalizedEmail = userEmail.toLowerCase().trim();
      const { data: purchaseByEmail } = await supabase
        .from('product_purchases')
        .select('id')
        .eq('product_id', courseId)
        .eq('product_type', 'course')
        .eq('payment_status', 'success')
        .eq('access_granted', true)
        .eq('buyer_email', normalizedEmail)
        .maybeSingle();

      if (purchaseByEmail) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking course access:', error);
    return false;
  }
}

/**
 * Link guest purchases to a user account when they sign up/sign in
 * This should be called after successful registration or login
 * 
 * Uses the database function link_guest_purchases_to_user() which:
 * - Bypasses RLS restrictions (SECURITY DEFINER)
 * - Updates updated_at field automatically
 * - Executes in a single atomic transaction
 * - More efficient than direct queries
 */
export async function linkGuestPurchases(
  userId: string,
  userEmail: string
): Promise<{ linked: number; error?: string }> {
  try {
    const normalizedEmail = userEmail.toLowerCase().trim();

    // Call the database function via RPC
    // This function uses SECURITY DEFINER to bypass RLS and handles everything atomically
    const { data, error } = await supabase.rpc('link_guest_purchases_to_user', {
      p_user_id: userId,
      p_user_email: normalizedEmail
    });

    if (error) {
      throw error;
    }

    // Handle response from database function
    if (data?.success) {
      const linkedCount = data.linked_count || 0;
      if (linkedCount > 0) {
        console.log(`✅ Linked ${linkedCount} guest purchase(s) to user account`);
      }
      return { linked: linkedCount };
    } else {
      // Function returned success: false
      const errorMessage = data?.error || 'Failed to link guest purchases';
      console.error('Database function returned error:', errorMessage);
      return { linked: 0, error: errorMessage };
    }
  } catch (error: any) {
    console.error('Error linking guest purchases:', error);
    return { linked: 0, error: error.message };
  }
}

/**
 * Get user's email from session or local storage (for guest checkout)
 */
export function getGuestEmail(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try to get from sessionStorage (guest checkout)
  const guestEmail = sessionStorage.getItem('guest_email');
  if (guestEmail) return guestEmail;

  // Try to get from localStorage (persistent guest)
  const persistentEmail = localStorage.getItem('guest_email');
  if (persistentEmail) return persistentEmail;

  return null;
}

/**
 * Store guest email for checkout
 */
export function setGuestEmail(email: string): void {
  if (typeof window === 'undefined') return;
  
  const normalizedEmail = email.toLowerCase().trim();
  sessionStorage.setItem('guest_email', normalizedEmail);
  localStorage.setItem('guest_email', normalizedEmail);
}
