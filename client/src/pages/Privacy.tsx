import React from 'react';
import { BreadcrumbPageWrapper } from '../components/SEO/Breadcrumbs';

const Privacy: React.FC = () => {
  return (
    <BreadcrumbPageWrapper
      title="Privacy Policy - King Ezekiel Academy"
      description="Learn about how King Ezekiel Academy collects, uses, and protects your personal information. Read our comprehensive privacy policy."
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Privacy Policy', url: '/privacy' }
      ]}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600">
            Last updated: January 31, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 mb-6">
            At King Ezekiel Academy, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
          <p className="text-gray-700 mb-4">
            We collect information you provide directly to us, such as when you:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>Create an account or sign up for our services</li>
            <li>Enroll in courses or purchase subscriptions</li>
            <li>Contact us for support or inquiries</li>
            <li>Participate in surveys or promotions</li>
            <li>Subscribe to our newsletter</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>Provide and maintain our educational services</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send you important updates and notifications</li>
            <li>Improve our website and services</li>
            <li>Provide customer support</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information Sharing</h2>
          <p className="text-gray-700 mb-6">
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
          <p className="text-gray-700 mb-6">
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Rights</h2>
          <p className="text-gray-700 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent for data processing</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-6">
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              <strong>Email:</strong> privacy@thekingezekielacademy.com<br />
              <strong>Address:</strong> Lagos, Nigeria<br />
              <strong>Website:</strong> https://thekingezekielacademy.com
            </p>
          </div>
        </div>
      </div>
    </BreadcrumbPageWrapper>
  );
};

export default Privacy;
