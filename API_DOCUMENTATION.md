# 📚 **API DOCUMENTATION**

## 🔗 **Base URLs**

- **Production**: `https://app.thekingezekielacademy.com/api`
- **Development**: `http://localhost:5000/api`

## 🔐 **Authentication**

All API endpoints require authentication via Supabase JWT tokens.

```javascript
// Include token in headers
const headers = {
  'Authorization': `Bearer ${supabaseToken}`,
  'Content-Type': 'application/json'
};
```

## 📊 **Endpoints Overview**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| POST | `/paystack/secure-payment/initialize` | Initialize payment | Yes |
| POST | `/paystack/secure-payment/verify` | Verify payment | Yes |
| POST | `/paystack/secure-payment/create-subscription` | Create subscription | Yes |
| POST | `/paystack/secure-payment/cancel-subscription` | Cancel subscription | Yes |
| GET | `/paystack/secure-payment/subscription/:id` | Get subscription | Yes |

## 🏥 **Health Check**

### **GET /health**

Check API health and configuration.

**Response:**
```json
{
  "success": true,
  "message": "Paystack API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": {
    "hasSecretKey": true,
    "hasPublicKey": true,
    "hasPlanCode": true
  }
}
```

## 💳 **Payment Endpoints**

### **POST /paystack/secure-payment/initialize**

Initialize a new payment.

**Request Body:**
```json
{
  "email": "user@example.com",
  "amount": 99.99,
  "reference": "KEA_1234567890_abc123",
  "metadata": {
    "user_id": "user-123",
    "course_id": "course-456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "access_code_123",
    "reference": "KEA_1234567890_abc123"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Email, amount, and reference are required"
}
```

### **POST /paystack/secure-payment/verify**

Verify a payment transaction.

**Request Body:**
```json
{
  "reference": "KEA_1234567890_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1234567890,
    "amount": 999900,
    "currency": "NGN",
    "status": "success",
    "reference": "KEA_1234567890_abc123",
    "customer": {
      "id": 123456,
      "email": "user@example.com"
    }
  }
}
```

## 🔄 **Subscription Endpoints**

### **POST /paystack/secure-payment/create-subscription**

Create a recurring subscription.

**Request Body:**
```json
{
  "customer_code": "CUS_1234567890",
  "plan_code": "PLN_1234567890",
  "start_date": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1234567890,
    "customer": 123456,
    "plan": 1234567890,
    "status": "active",
    "start": "2024-01-01T00:00:00.000Z"
  }
}
```

### **POST /paystack/secure-payment/cancel-subscription**

Cancel an active subscription.

**Request Body:**
```json
{
  "subscription_code": "SUB_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1234567890,
    "status": "cancelled",
    "cancelled_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### **GET /paystack/secure-payment/subscription/:subscription_code**

Get subscription details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1234567890,
    "customer": 123456,
    "plan": 1234567890,
    "status": "active",
    "start": "2024-01-01T00:00:00.000Z",
    "next_payment_date": "2024-02-01T00:00:00.000Z"
  }
}
```

## 🚨 **Error Handling**

### **Error Response Format**

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### **Common Error Codes**

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid request data | 400 |
| `AUTHENTICATION_ERROR` | Invalid or missing token | 401 |
| `AUTHORIZATION_ERROR` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `PAYMENT_ERROR` | Payment processing failed | 400 |
| `SUBSCRIPTION_ERROR` | Subscription operation failed | 400 |
| `INTERNAL_ERROR` | Server error | 500 |

### **Error Examples**

#### **Validation Error**
```json
{
  "success": false,
  "message": "Email, amount, and reference are required",
  "code": "VALIDATION_ERROR",
  "details": {
    "missing_fields": ["email", "amount"]
  }
}
```

#### **Payment Error**
```json
{
  "success": false,
  "message": "Payment initialization failed",
  "code": "PAYMENT_ERROR",
  "details": {
    "paystack_error": "Invalid amount"
  }
}
```

## 🔒 **Security**

### **Rate Limiting**
- 100 requests per minute per IP
- 1000 requests per hour per user

### **CORS**
- Allowed origins: `https://app.thekingezekielacademy.com`
- Credentials: `true`
- Methods: `GET, POST, PUT, DELETE, OPTIONS`

### **Headers**
- `Content-Type: application/json`
- `Authorization: Bearer <token>`
- `X-Requested-With: XMLHttpRequest`

## 📝 **Request/Response Examples**

### **Complete Payment Flow**

#### **1. Initialize Payment**
```javascript
const response = await fetch('/api/paystack/secure-payment/initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    amount: 99.99,
    reference: 'KEA_1234567890_abc123',
    metadata: {
      user_id: 'user-123',
      course_id: 'course-456'
    }
  })
});

const result = await response.json();
// Redirect user to result.data.authorization_url
```

#### **2. Verify Payment**
```javascript
const response = await fetch('/api/paystack/secure-payment/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reference: 'KEA_1234567890_abc123'
  })
});

const result = await response.json();
if (result.success && result.data.status === 'success') {
  // Payment successful, update user subscription
}
```

## 🧪 **Testing**

### **Test Environment**
- Use Paystack test keys
- Test with small amounts
- Verify webhook handling

### **Test Data**
```json
{
  "email": "test@example.com",
  "amount": 1.00,
  "reference": "TEST_1234567890_abc123"
}
```

## 📊 **Monitoring**

### **Logs**
- All requests are logged
- Errors are tracked
- Performance metrics collected

### **Metrics**
- Request count
- Response times
- Error rates
- Payment success rates

## 🔄 **Webhooks**

### **Paystack Webhooks**
- Payment success: `https://your-domain.com/api/webhooks/paystack`
- Subscription events: `https://your-domain.com/api/webhooks/paystack`

### **Webhook Security**
- Verify webhook signatures
- Validate payload integrity
- Handle duplicate events

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production Ready
