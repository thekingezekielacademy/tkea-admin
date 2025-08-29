# 🚀 Paystack Integration Guide

## Overview
This guide covers the complete Paystack integration for recurring subscriptions in the King Ezekiel Academy platform.

## 🔑 Configuration

### Environment Variables
Add these to your `.env` file:
```bash
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_021c63210a1910a260b520b8bfa97cce19e996d8
REACT_APP_PAYSTACK_PLAN_CODE=PLN_fx0dayx3idr67x1
```

### Paystack Dashboard Setup
1. **Plan Configuration**: Ensure your plan `PLN_fx0dayx3idr67x1` is set up for monthly recurring billing
2. **Webhook URL**: Set webhook URL to `/api/paystack/webhook` (if implementing server-side webhooks)
3. **Test Mode**: Currently using test keys for development

## 🏗️ Architecture

### Components
- **PaymentModal**: Handles payment initiation
- **PaymentVerification**: Processes Paystack callbacks
- **PaystackService**: Core payment logic

### Database Tables
- `user_subscriptions`: Stores subscription details
- `subscription_payments`: Tracks payment history

## 💳 Payment Flow

### 1. Subscription Initiation
```
User clicks "Subscribe Now" → PaymentModal opens → User enters email → Paystack payment initialized
```

### 2. Payment Processing
```
Paystack redirects user → User completes payment → Paystack redirects back with reference
```

### 3. Payment Verification
```
PaymentVerification page → Verifies payment with Paystack → Creates subscription → Saves to database
```

### 4. Subscription Activation
```
User gets full access → Subscription status updated → Payment history recorded
```

## 🔧 Implementation Details

### PaystackService Methods
- `initializePayment()`: Starts payment process
- `verifyPayment()`: Confirms payment success
- `createSubscription()`: Sets up recurring billing
- `saveSubscriptionToDatabase()`: Stores subscription data
- `savePaymentToDatabase()`: Records payment history

### Security Features
- Row Level Security (RLS) enabled on all tables
- User can only access their own data
- Payment verification with Paystack API
- Secure callback handling

## 📱 User Experience

### For New Users
1. Click "Subscribe Now" on any page
2. Enter email address
3. Redirected to Paystack payment page
4. Complete payment with card/bank transfer
5. Automatically redirected back and activated

### For Existing Users
1. Access subscription management in profile
2. View billing history and payment status
3. Cancel subscription if needed
4. Re-subscribe after cancellation

## 🚨 Error Handling

### Common Issues
- **Payment Failed**: User redirected to error page with retry option
- **Network Issues**: Graceful fallback with user-friendly messages
- **Invalid Reference**: Payment verification fails, user notified

### Fallback Mechanisms
- Local storage for subscription status
- Database as source of truth
- Automatic retry for failed operations

## 🧪 Testing

### Test Cards
Use Paystack test cards for development:
- **Success**: 4084 0840 8408 4081
- **Declined**: 4084 0840 8408 4082
- **Insufficient Funds**: 4084 0840 8408 4083

### Test Scenarios
1. Successful subscription
2. Failed payment
3. Subscription cancellation
4. Re-subscription after cancellation

## 📊 Monitoring

### Key Metrics
- Payment success rate
- Subscription conversion rate
- Payment failure reasons
- User subscription lifecycle

### Logging
- All payment operations logged
- Error tracking and reporting
- User action audit trail

## 🔄 Webhook Integration (Future)

### Planned Features
- Server-side webhook handling
- Automatic subscription status updates
- Payment failure notifications
- Subscription renewal confirmations

## 🚀 Deployment

### Production Checklist
- [ ] Update to production Paystack keys
- [ ] Test payment flow end-to-end
- [ ] Verify database tables and policies
- [ ] Monitor payment success rates
- [ ] Set up error alerting

### Environment Variables
```bash
# Production
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_live_...
REACT_APP_PAYSTACK_PLAN_CODE=PLN_...
```

## 📚 API Reference

### Paystack Endpoints Used
- `POST /transaction/initialize` - Start payment
- `GET /transaction/verify/:reference` - Verify payment
- `POST /subscription` - Create subscription
- `POST /subscription/disable` - Cancel subscription

### Response Formats
All Paystack responses include:
- `status`: boolean indicating success
- `data`: response payload
- `message`: error message if applicable

## 🆘 Support

### Troubleshooting
1. Check browser console for errors
2. Verify environment variables
3. Confirm Paystack plan configuration
4. Check database table permissions

### Contact
For technical issues:
- Check Paystack documentation
- Review application logs
- Test with Paystack test environment

---

**Note**: This integration is currently in test mode. Switch to production keys before going live.
