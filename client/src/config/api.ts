// API Configuration
// This file centralizes API URL configuration for different environments

const API_BASE = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://app.thekingezekielacademy.com/api' // Use production domain
    : 'https://app.thekingezekielacademy.com/api');

// API Configuration - Production Ready
console.log('🔧 API Configuration Debug - CACHE BUST V7 - FINAL FIX:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('API_BASE:', API_BASE);
console.log('FLUTTERWAVE_INITIALIZE_PAYMENT:', `${API_BASE}/api/flutterwave/initialize-payment`);
console.log('Current URL:', window.location.href);
console.log('Timestamp:', new Date().toISOString());
console.log('Build Hash:', 'V7-FINAL-FIX');

export { API_BASE };

// Export specific API endpoints
export const API_ENDPOINTS = {
  FLUTTERWAVE_INITIALIZE_PAYMENT: `${API_BASE}/api/flutterwave/initialize-payment`,
  FLUTTERWAVE_WEBHOOK: `${API_BASE}/api/flutterwave/webhook`,
  HEALTH_CHECK: `${API_BASE}/api/health`,
  SUBSCRIPTION: `${API_BASE}/api/subscription`,
  PAYMENTS: `${API_BASE}/api/payments`
} as const;

// Helper function to make API calls with proper error handling
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    console.log('🌐 Making API call to:', endpoint);
    
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`API returned HTML instead of JSON. Status: ${response.status}. This usually means the server is not running or the route doesn't exist.`);
      }
      
      // Try to parse error response as JSON
      let errorMessage = `API call failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ API call successful:', data);
    return data;
  } catch (error) {
    console.error('❌ API call failed:', error);
    
    // Enhanced error handling for different error types
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error(`Network error: Unable to connect to ${endpoint}. Please check if the server is running and accessible.`);
    }
    
    throw error;
  }
};
