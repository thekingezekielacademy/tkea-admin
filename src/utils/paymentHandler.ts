import { supabase } from '../lib/supabase';
import { emailService } from '../services/emailService';

/**
 * Handle successful payment for a guest purchase
 * Updates the purchase record, grants access, and sends confirmation email
 */
export async function handleGuestPaymentSuccess(
  purchaseId: string,
  paymentReference: string,
  amountPaid: number
): Promise<{ success: boolean; error?: string; emailSent?: boolean }> {
  try {
    // First, fetch the purchase details to get product info and buyer email
    const { data: purchase, error: fetchError } = await supabase
      .from('product_purchases')
      .select('product_id, product_type, buyer_email')
      .eq('id', purchaseId)
      .single();

    if (fetchError) throw fetchError;
    if (!purchase) throw new Error('Purchase not found');

    // Update purchase record
    const { error: updateError } = await supabase
      .from('product_purchases')
      .update({
        payment_status: 'success',
        amount_paid: amountPaid,
        access_granted: true,
        access_granted_at: new Date().toISOString(),
        payment_reference: paymentReference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    if (updateError) throw updateError;

    // Send purchase confirmation email
    let emailSent = false;
    if (purchase.buyer_email) {
      try {
        // Fetch product details (course or learning path)
        const productTable = purchase.product_type === 'course' ? 'courses' : 'learning_paths';
        const { data: product, error: productError } = await supabase
          .from(productTable)
          .select('title')
          .eq('id', purchase.product_id)
          .single();

        if (!productError && product) {
          const appUrl = window.location.origin;
          const productUrl =
            purchase.product_type === 'course'
              ? `${appUrl}/course/${purchase.product_id}`
              : `${appUrl}/learning-path/${purchase.product_id}`;

          const emailResult = await emailService.sendPurchaseConfirmationEmail({
            email: purchase.buyer_email,
            name: 'Valued Student', // Guest users don't have a name yet
            productType: purchase.product_type as 'course' | 'learning_path',
            productTitle: product.title,
            productUrl: productUrl,
          });

          emailSent = emailResult.success;
          if (!emailResult.success) {
            console.warn('Failed to send purchase confirmation email:', emailResult.error);
          }
        }
      } catch (emailError: any) {
        console.error('Error sending purchase confirmation email:', emailError);
        // Don't fail the payment if email fails
      }
    }

    return { success: true, emailSent };
  } catch (error: any) {
    console.error('Error handling guest payment success:', error);
    return { success: false, error: error.message, emailSent: false };
  }
}

/**
 * Handle failed payment for a guest purchase
 */
export async function handleGuestPaymentFailure(
  purchaseId: string,
  errorMessage?: string
): Promise<{ success: boolean }> {
  try {
    await supabase
      .from('product_purchases')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    return { success: true };
  } catch (error: any) {
    console.error('Error handling guest payment failure:', error);
    return { success: false };
  }
}

/**
 * Create a guest purchase record
 */
export async function createGuestPurchase(
  productId: string,
  productType: 'course' | 'learning_path',
  buyerEmail: string,
  purchasePrice: number
): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
  try {
    const normalizedEmail = buyerEmail.toLowerCase().trim();
    const paymentReference = `GUEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: purchase, error } = await supabase
      .from('product_purchases')
      .insert({
        product_id: productId,
        product_type: productType,
        buyer_email: normalizedEmail,
        buyer_id: null, // Guest purchase
        purchase_price: purchasePrice,
        amount_paid: 0, // Will be updated after payment
        payment_status: 'pending',
        payment_reference: paymentReference,
        access_granted: false, // Will be granted after successful payment
      })
      .select('id')
      .single();

    if (error) throw error;

    return { success: true, purchaseId: purchase.id };
  } catch (error: any) {
    console.error('Error creating guest purchase:', error);
    return { success: false, error: error.message };
  }
}
