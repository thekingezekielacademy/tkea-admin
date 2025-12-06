import { emailService } from '../services/emailService';

export const notificationService = {
  success: (message: string) => {
    console.log('Success:', message);
    // You can integrate with a toast library here
    alert(`Success: ${message}`);
  },
  error: (message: string) => {
    console.error('Error:', message);
    // You can integrate with a toast library here
    alert(`Error: ${message}`);
  },
  info: (message: string) => {
    console.log('Info:', message);
    // You can integrate with a toast library here
    alert(`Info: ${message}`);
  },
  sendNewCourseNotification: async (courseTitle: string, category: string) => {
    console.log(`📧 Sending notification about new course: ${courseTitle} in category: ${category}`);
    // This is now handled by notifyUsersAboutNewCourse which sends emails directly
    return Promise.resolve();
  },
};

