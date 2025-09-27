interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
}

export const contactService = {
  async submitContactForm(formData: ContactFormData): Promise<ContactResponse> {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: 'Thank you for your message! We\'ll get back to you soon.'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to send message. Please try again.'
        };
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      return {
        success: false,
        message: 'Network error. Please try again later.'
      };
    }
  },

  async submitViaEmail(formData: ContactFormData): Promise<ContactResponse> {
    // Fallback email service - for now, just simulate success
    console.log('Email fallback service called with:', formData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.'
    };
  }
};
