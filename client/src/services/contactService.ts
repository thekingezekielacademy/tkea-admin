interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
  errors?: any[];
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const contactService = {
  async submitContactForm(formData: ContactFormData): Promise<ContactResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      return data;
    } catch (error) {
      console.error('Contact form submission error:', error);
      throw error;
    }
  },

  // Fallback method using email service (if backend is not available)
  async submitViaEmail(formData: ContactFormData): Promise<ContactResponse> {
    try {
      // This would typically use a service like EmailJS, SendGrid, or similar
      // For now, we'll simulate success
      console.log('Contact form data (email fallback):', formData);
      
      return {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      };
    } catch (error) {
      console.error('Email submission error:', error);
      throw error;
    }
  }
};
