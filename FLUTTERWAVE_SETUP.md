# 🚀 Flutterwave Integration Setup Guide

## Overview
This guide covers the complete Flutterwave integration for recurring subscriptions in the King Ezekiel Academy platform.

## 🔑 Configuration

### Environment Variables
Add these to your `.env` file:

```bash
# Flutterwave Configuration
REACT_APP_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_FLUTTERWAVE_PLAN_ID=PLAN_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret_here

# API Configuration
REACT_APP_API_URL=https://app.thekingezekielacademy.com/api
```

### Flutterwave Dashboard Setup
1. **Plan Configuration**: Create a plan for ₦2,500 monthly recurring billing
2. **Webhook URL**: Set webhook URL to `/api/flutterwave/webhook`
3. **Test Mode**: Currently using test keys for development

## 🏗️ Architecture

### Components
- **FlutterwavePaymentModal**: Handles payment initiation
- **PaymentVerification**: Processes Flutterwave callbacks
- **FlutterwaveService**: Core payment logic

### Database Tables
- `user_subscriptions`: Stores subscription details (flutterwave_subscription_id, flutterwave_customer_code)
- `subscription_payments`: Tracks payment history (flutterwave_transaction_id, flutterwave_reference)

## 💳 Payment Flow

### 1. Subscription Initiation
```
User clicks "Subscribe Now" → FlutterwavePaymentModal opens → User enters email → Flutterwave payment initialized
```

### 2. Payment Processing
```
Flutterwave redirects user → User completes payment → Flutterwave redirects back with tx_ref
```

### 3. Payment Verification
```
PaymentVerification page → Verifies payment with Flutterwave → Creates subscription → Saves to database
```

### 4. Subscription Activation
```
User gets full access → Subscription status updated → Payment history recorded
```

## 🔧 Implementation Details

### FlutterwaveService Methods
- `initializePayment()`: Starts payment process
- `verifyPayment()`: Confirms payment success
- `createSubscription()`: Sets up recurring billing
- `saveSubscriptionToDatabase()`: Stores subscription data
- `savePaymentToDatabase()`: Records payment history

### Security Features
- Row Level Security (RLS) enabled on all tables
- User can only access their own data
- Payment verification with Flutterwave API

## 🚀 Setup Steps

### Step 1: Get Your Flutterwave Keys
1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. Navigate to **Settings** > **API Keys & Webhooks**
3. Copy your **Secret Key** and **Public Key**
4. Create a **Plan** for ₦2,500 monthly subscription

### Step 2: Configure Environment Variables
1. Add the keys to your `.env` file
2. Update the API endpoints in your code
3. Test the integration

### Step 3: Test the Integration
1. Use Flutterwave's test cards
2. Test subscription creation
3. Test subscription cancellation
4. Verify webhook handling

## 📊 Flutterwave vs Paystack

| Feature | Flutterwave | Paystack |
|---------|-------------|----------|
| **Transaction Fees** | 1.4% | 1.5% + ₦100 |
| **International Support** | ✅ Extensive | ✅ Limited |
| **Mobile Money** | ✅ Advanced | ✅ Basic |
| **Split Payments** | ✅ Yes | ❌ No |
| **API Documentation** | ✅ Good | ✅ Excellent |
| **Customer Support** | ✅ Fast | ✅ Good |

## 🔧 Migration from Paystack

### Database Changes
- Replace `paystack_subscription_id` with `flutterwave_subscription_id`
- Replace `paystack_customer_code` with `flutterwave_customer_code`
- Replace `paystack_transaction_id` with `flutterwave_transaction_id`
- Replace `paystack_reference` with `flutterwave_reference`

### Code Changes
- Replace `paystackService` with `flutterwaveService`
- Replace `PaymentModal` with `FlutterwavePaymentModal`
- Update API endpoints from `/api/paystack/` to `/api/flutterwave/`
- Update webhook handling for Flutterwave format

## 🚨 Important Notes

1. **Test Mode**: Always test in Flutterwave's sandbox environment first
2. **Webhooks**: Ensure webhook URLs are properly configured
3. **Error Handling**: Implement proper error handling for failed payments
4. **Security**: Never expose secret keys in client-side code
5. **Monitoring**: Monitor transaction success rates and customer feedback

## 📞 Support

- **Flutterwave Support**: [support@flutterwave.com](mailto:support@flutterwave.com)
- **Documentation**: [developer.flutterwave.com](https://developer.flutterwave.com/)
- **Status Page**: [status.flutterwave.com](https://status.flutterwave.com/)
