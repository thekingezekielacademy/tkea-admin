// Secure logging utility for production environments
export const secureLog = (message: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data);
  }
  // In production, you might want to send logs to a secure logging service
  // For now, we'll just suppress them
};

export const secureError = (message: string, error?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  }
  // In production, you might want to send errors to a secure error tracking service
  // For now, we'll just suppress them
};

export const secureWarn = (message: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(message, data);
  }
};