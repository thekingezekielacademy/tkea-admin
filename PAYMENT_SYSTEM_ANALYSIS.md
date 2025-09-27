# 💳 KING EZEKIEL ACADEMY - COMPLETE PAYMENT SYSTEM ANALYSIS

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

The payment system is a **dual-provider architecture** supporting both **Paystack** and **Flutterwave** with comprehensive subscription management, webhook handling, and database integration.

---

## 📊 DATABASE SCHEMA

### Core Tables

#### 1. **user_subscriptions** Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → profiles.id)
- paystack_subscription_id (TEXT)
- paystack_customer_code (TEXT)
- flutterwave_subscription_id (TEXT)
- flutterwave_customer_code (TEXT)
- plan_name (TEXT, DEFAULT: 'Monthly Membership')
- status (TEXT, CHECK: 'active', 'inactive', 'cancelled', 'expired')
- amount (INTEGER, in kobo - ₦2,500 = 250,000 kobo)
- currency (TEXT, DEFAULT: 'NGN')
- start_date (TIMESTAMP)
- next_payment_date (TIMESTAMP)
- cancelled_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. **subscription_payments** Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → profiles.id)
- paystack_transaction_id (TEXT)
- paystack_reference (TEXT)
- flutterwave_transaction_id (TEXT)
- flutterwave_reference (TEXT)
- amount (INTEGER, in kobo)
- currency (TEXT, DEFAULT: 'NGN')
- status (TEXT, CHECK: 'success', 'failed', 'pending')
- payment_method (TEXT, DEFAULT: 'card')
- paid_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

---

## 🔄 PAYMENT FLOW ARCHITECTURE

### **FLOW 1: FLUTTERWAVE PAYMENT FLOW**

#### **Step 1: Payment Initiation**
```
User clicks "Subscribe" → FlutterwavePaymentModal opens
→ User enters email/phone → Frontend calls /api/flutterwave/initialize-payment
→ Server validates input → Server calls Flutterwave API
→ Returns payment link → User redirected to Flutterwave
```

#### **Step 2: Payment Processing**
```
User completes payment on Flutterwave → Flutterwave processes payment
→ Flutterwave redirects to /payment-verification with tx_ref
→ PaymentVerification component loads
```

#### **Step 3: Payment Verification**
```
PaymentVerification calls flutterwaveService.verifyPayment()
→ Flutterwave API verifies transaction → If successful:
→ flutterwaveService.savePaymentToDatabase() → Creates subscription
→ flutterwaveService.saveSubscriptionToDatabase() → Updates user status
→ User redirected to /subscription with active status
```

#### **Step 4: Webhook Handling (Backup)**
```
Flutterwave sends webhook to /api/flutterwave/webhook
→ Webhook handler processes event → Updates database
→ Ensures payment/subscription records are created
```

---

### **FLOW 2: PAYSTACK PAYMENT FLOW**

#### **Step 1: Payment Initiation**
```
User clicks "Subscribe" → PaystackPaymentModal opens
→ User enters details → Frontend calls /api/paystack/initialize-payment
→ Server creates Paystack transaction → Returns payment link
→ User redirected to Paystack
```

#### **Step 2: Payment Processing**
```
User completes payment → Paystack processes payment
→ Paystack redirects to callback URL → Frontend handles callback
```

#### **Step 3: Payment Verification**
```
Frontend calls /api/paystack/verify-payment
→ Server verifies with Paystack API → If successful:
→ Creates subscription record → Updates user status
→ User gets access to premium content
```

#### **Step 4: Webhook Handling**
```
Paystack sends webhook to /api/paystack/webhook
→ WebhookHandler processes event → Updates database
→ Ensures subscription status is maintained
```

---

## 🛠️ COMPONENT BREAKDOWN

### **Frontend Components**

#### **1. FlutterwavePaymentModal.tsx**
- **Purpose**: Handles Flutterwave payment initiation
- **Features**:
  - Email/phone validation
  - Mobile/desktop detection
  - Payment amount configuration (₦2,500)
  - Error handling and retry logic
  - Loading states and user feedback

#### **2. PaymentVerification.tsx**
- **Purpose**: Handles payment verification after redirect
- **Features**:
  - URL parameter parsing (tx_ref, status, transaction_id)
  - Flutterwave API verification
  - Database record creation
  - Subscription status updates
  - Error handling and retry mechanisms
  - Success/failure UI states

#### **3. FlutterwaveService.ts**
- **Purpose**: Core Flutterwave integration service
- **Methods**:
  - `initializePayment()`: Creates payment session
  - `verifyPayment()`: Verifies transaction status
  - `savePaymentToDatabase()`: Records payment
  - `createSubscription()`: Creates recurring subscription
  - `saveSubscriptionToDatabase()`: Records subscription

### **Backend Components**

#### **1. Flutterwave Routes (/api/flutterwave/)**
- **initialize-payment**: Creates payment session
- **webhook**: Handles Flutterwave webhooks
- **verify-payment**: Verifies transaction status

#### **2. Paystack Routes (/api/paystack/)**
- **initialize-payment**: Creates Paystack transaction
- **verify-payment**: Verifies Paystack transaction
- **webhook**: Handles Paystack webhooks

#### **3. Subscription Service**
- **Purpose**: Manages subscription lifecycle
- **Features**:
  - User subscription retrieval
  - Subscription creation
  - Payment record creation
  - Cache management
  - Error handling

#### **4. Billing Service**
- **Purpose**: Manages billing history and invoices
- **Features**:
  - Billing history retrieval
  - Invoice generation
  - CSV export functionality
  - Payment record management

---

## 🔐 SECURITY & VALIDATION

### **Input Validation**
- Email format validation
- Phone number validation
- Amount validation (must be ₦2,500)
- Plan name validation
- User authentication checks

### **Webhook Security**
- Signature verification for Paystack
- Hash verification for Flutterwave
- Rate limiting on webhook endpoints
- IP whitelisting (optional)

### **Database Security**
- Row Level Security (RLS) enabled
- User-specific data access
- Transaction integrity
- Audit logging

---

## 📱 MOBILE COMPATIBILITY

### **Mobile Detection**
- User agent detection
- Responsive payment forms
- Mobile-optimized payment options
- Touch-friendly interfaces

### **In-App Browser Support**
- Special handling for in-app browsers
- Hash router compatibility
- Meta Pixel integration
- Flutterwave script loading

---

## 🔄 WEBHOOK EVENTS HANDLED

### **Flutterwave Webhooks**
- `charge.completed`: Payment successful
- `subscription.created`: New subscription
- `subscription.updated`: Subscription modified
- `subscription.cancelled`: Subscription cancelled

### **Paystack Webhooks**
- `charge.success`: Payment successful
- `subscription.create`: New subscription
- `subscription.disable`: Subscription disabled
- `subscription.enable`: Subscription enabled
- `invoice.payment_failed`: Payment failed
- `invoice.payment_success`: Payment successful

---

## 💰 PRICING & CURRENCY

### **Subscription Details**
- **Amount**: ₦2,500 (250,000 kobo)
- **Currency**: NGN (Nigerian Naira)
- **Billing Cycle**: Monthly
- **Plan Name**: "Monthly Membership"

### **Payment Methods Supported**
- **Flutterwave**: Card, Mobile Money, USSD, Bank Transfer
- **Paystack**: Card, Bank Transfer, USSD

---

## 🚨 ERROR HANDLING & RECOVERY

### **Payment Failures**
- Automatic retry mechanisms
- User-friendly error messages
- Fallback payment options
- Support contact information

### **Database Errors**
- Transaction rollback
- Duplicate prevention
- Data integrity checks
- Audit logging

### **Network Issues**
- Timeout handling
- Retry logic
- Offline detection
- Graceful degradation

---

## 📊 MONITORING & ANALYTICS

### **Payment Tracking**
- Transaction status monitoring
- Payment success rates
- Failure analysis
- User journey tracking

### **Subscription Management**
- Active subscription counts
- Churn rate monitoring
- Revenue tracking
- User engagement metrics

---

## 🔧 CONFIGURATION & ENVIRONMENT

### **Environment Variables**
```bash
# Flutterwave
REACT_APP_FLUTTERWAVE_PUBLIC_KEY
REACT_APP_FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_WEBHOOK_SECRET

# Paystack
REACT_APP_PAYSTACK_PUBLIC_KEY
PAYSTACK_SECRET_KEY
PAYSTACK_WEBHOOK_SECRET

# Database
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

# API
REACT_APP_API_URL
```

### **API Endpoints**
- `/api/flutterwave/initialize-payment`
- `/api/flutterwave/webhook`
- `/api/paystack/initialize-payment`
- `/api/paystack/verify-payment`
- `/api/paystack/webhook`
- `/api/subscriptions`
- `/api/billing`

---

## 🎯 KEY FEATURES

### **Dual Provider Support**
- Flutterwave (Primary)
- Paystack (Secondary)
- Automatic failover
- Provider-specific optimizations

### **Subscription Management**
- Active subscription tracking
- Payment history
- Billing cycle management
- Cancellation handling

### **User Experience**
- Seamless payment flow
- Mobile optimization
- Error recovery
- Success confirmation

### **Admin Features**
- Manual subscription activation
- Payment verification
- User subscription management
- Billing history export

---

## 🚀 DEPLOYMENT CONSIDERATIONS

### **Production Requirements**
- SSL certificates
- Webhook URL configuration
- Environment variable setup
- Database migrations
- Monitoring setup

### **Testing**
- Sandbox environments
- Test payment methods
- Webhook testing
- Error scenario testing

---

## 📈 PERFORMANCE OPTIMIZATIONS

### **Caching**
- User subscription cache
- Payment status cache
- API response caching
- Database query optimization

### **Rate Limiting**
- API endpoint protection
- Webhook rate limiting
- User request limiting
- DDoS protection

---

## 🔍 TROUBLESHOOTING GUIDE

### **Common Issues**
1. **Payment Not Reflecting**: Check webhook configuration
2. **Subscription Not Active**: Verify database records
3. **Mobile Payment Issues**: Check in-app browser handling
4. **Webhook Failures**: Verify signature validation

### **Debug Tools**
- Payment verification scripts
- Database query tools
- Webhook testing endpoints
- Log analysis tools

---

## 📋 MAINTENANCE TASKS

### **Regular Maintenance**
- Database cleanup
- Log rotation
- Performance monitoring
- Security updates

### **Monitoring Alerts**
- Payment failure rates
- Webhook failures
- Database errors
- API response times

---

This comprehensive analysis covers the entire payment system from A to Z, including architecture, components, flows, security, and maintenance considerations for the King Ezekiel Academy platform.
