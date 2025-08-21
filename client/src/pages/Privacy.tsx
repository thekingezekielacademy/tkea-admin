import React from 'react';
import { FaShieldAlt, FaUserLock, FaEye, FaTrash, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Privacy: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <FaShieldAlt className="mr-2 h-4 w-4" />
            Privacy & Security
          </div>
          <h1 className="text-4xl font-bold text-primary-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-primary-600">
            Effective Date: January 1, 2024
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">1. Information We Collect</h2>
            <p className="text-primary-700 mb-4">
              We may collect the following types of information:
            </p>
            <ul className="space-y-3 text-primary-700">
              <li className="flex items-start">
                <FaUserLock className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                <span><strong>Personal Information:</strong> Name, phone number, email address, date of birth, and home address</span>
              </li>
              <li className="flex items-start">
                <FaUserLock className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                <span><strong>Educational Information:</strong> Courses enrolled in, progress reports, assignments, and certifications</span>
              </li>
              <li className="flex items-start">
                <FaUserLock className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                <span><strong>Technical Information:</strong> IP address, browser type, device details, and cookies</span>
              </li>
              <li className="flex items-start">
                <FaUserLock className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                <span><strong>Financial Information:</strong> Billing details and payment methods for course payments</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">2. How We Use Your Information</h2>
            <p className="text-primary-700 mb-4">
              We use your information to:
            </p>
            <ul className="space-y-3 text-primary-700">
              <li>• Provide educational services and process your enrollment</li>
              <li>• Communicate updates, schedules, assignments, and certificates</li>
              <li>• Process payments and maintain transaction records</li>
              <li>• Improve our services, website, and learning experience</li>
              <li>• Send marketing communications (only with your consent)</li>
              <li>• Ensure compliance with legal and regulatory requirements</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">3. Information Sharing & Disclosure</h2>
            <p className="text-primary-700 mb-4">
              We will never sell your information. However, we may share your data with:
            </p>
            <ul className="space-y-3 text-primary-700">
              <li>• <strong>Service Providers:</strong> Trusted partners who help us process payments, deliver online classes, or host our website</li>
              <li>• <strong>Legal Authorities:</strong> When required to comply with applicable laws, regulations, or legal processes</li>
              <li>• <strong>Business Transfers:</strong> In case of a merger, acquisition, or restructuring of The King Ezekiel Academy</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">4. Data Storage & Security</h2>
            <div className="space-y-4 text-primary-700">
              <p>We use industry-standard security measures to protect your personal information.</p>
              <p>Access to your data is limited to authorized staff and service providers.</p>
              <p className="text-amber-600 font-medium">
                ⚠️ Please note that no method of electronic storage or transmission over the internet is 100% secure.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">5. Your Rights</h2>
            <p className="text-primary-700 mb-4">
              You have the right to:
            </p>
            <ul className="space-y-3 text-primary-700">
              <li className="flex items-start">
                <FaEye className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                <span>Access and request a copy of the personal data we hold about you</span>
              </li>
              <li className="flex items-start">
                <FaEye className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                <span>Request corrections or updates to your information</span>
              </li>
              <li className="flex items-start">
                <FaTrash className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                <span>Request deletion of your personal data, subject to legal obligations</span>
              </li>
              <li className="flex items-start">
                <FaTrash className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                <span>Opt-out of receiving marketing communications</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">6. Cookies & Tracking</h2>
            <p className="text-primary-700">
              Our website may use cookies to improve user experience, analyze trends, and personalize content. 
              You can control or disable cookies in your browser settings.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">7. Children's Privacy</h2>
            <p className="text-primary-700">
              Our services are not directed to individuals under the age of 13 (or the minimum age required in your country). 
              We do not knowingly collect data from children without parental or guardian consent.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">8. Changes to This Privacy Policy</h2>
            <p className="text-primary-700">
              We may update this Privacy Policy from time to time. Updates will be posted on our website with a revised "Effective Date."
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">9. Contact Us</h2>
            <p className="text-primary-700 mb-6">
              If you have any questions or concerns about this Privacy Policy, you can contact us at:
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FaEnvelope className="h-5 w-5 text-primary-600" />
                <span className="text-primary-700">info@kingezekielacademy.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaPhone className="h-5 w-5 text-primary-600" />
                <span className="text-primary-700">+234 (0) 123 456 7890</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="h-5 w-5 text-primary-600" />
                <span className="text-primary-700">Lagos, Nigeria</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
