// Secure logging utility - only logs in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export const secureLog = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(message, data);
  }
};

export const secureError = (message: string, error?: any) => {
  if (isDevelopment) {
    console.error(message, error);
  }
};

export const secureWarn = (message: string, data?: any) => {
  if (isDevelopment) {
    console.warn(message, data);
  }
};

// For critical errors that should always be logged (but without sensitive data)
export const criticalLog = (message: string, error?: any) => {
  if (isDevelopment) {
    console.error(message, error);
  } else {
    // In production, log minimal info to avoid information disclosure
    console.error(message, 'Error occurred');
  }
};
