import React from 'react';
import { FaFileContract, FaCheck, FaTimes, FaGraduationCap, FaCreditCard, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import SEOHead from '@/components/SEO/SEOHead';

const Terms: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Terms of Service - King Ezekiel Academy"
        description="Read our comprehensive terms of service for King Ezekiel Academy. Understand your rights and responsibilities when using our educational platform."
        canonical="/terms"
      />
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              <FaFileContract className="mr-2 h-4 w-4" />
              Legal Terms
            </div>
            <h1 className="text-4xl font-bold text-primary-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-primary-600">
              Effective Date: January 1, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">1. Acceptance of Terms</h2>
              <p className="text-primary-700">
                Welcome to THE KING EZEKIEL ACADEMY ("we," "our," or "us"). By accessing or using our website, courses, and services, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully before using our platform.
              </p>
              <p className="text-primary-700 mt-4">
                By creating an account, enrolling in a course, subscribing, or otherwise using our services, you agree to these Terms. If you do not agree, you may not use our services.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">2. Services Provided</h2>
              <div className="space-y-4 text-primary-700">
                <p>THE KING EZEKIEL ACADEMY offers:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <FaGraduationCap className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Online educational content and training programs</span>
                  </li>
                  <li className="flex items-start">
                    <FaGraduationCap className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                    <span>25+ comprehensive courses across various digital skills</span>
                  </li>
                  <li className="flex items-start">
                    <FaGraduationCap className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Memberships, subscriptions, and community features</span>
                  </li>
                  <li className="flex items-start">
                    <FaGraduationCap className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Support and mentorship services</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">3. User Accounts</h2>
              <div className="space-y-4 text-primary-700">
                <p>To access our services, you must:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <FaCheck className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Provide accurate and complete registration information</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Maintain the security of your account credentials</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Be responsible for all activities under your account</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Notify us immediately of any unauthorized use</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">4. Payment Terms</h2>
              <div className="space-y-4 text-primary-700">
                <p>Payment and subscription terms:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <FaCreditCard className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                    <span>All fees are stated in Nigerian Naira (₦) and are non-refundable unless otherwise specified</span>
                  </li>
                  <li className="flex items-start">
                    <FaCreditCard className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Subscriptions automatically renew unless cancelled before the renewal date</span>
                  </li>
                  <li className="flex items-start">
                    <FaCreditCard className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                    <span>We use Flutterwave for secure payment processing</span>
                  </li>
                  <li className="flex items-start">
                    <FaCreditCard className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Free courses available to all registered users</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">5. Prohibited Uses</h2>
              <div className="space-y-4 text-primary-700">
                <p>You may not use our services for:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <FaTimes className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Any unlawful purpose or to solicit others to perform unlawful acts</span>
                  </li>
                  <li className="flex items-start">
                    <FaTimes className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Violating any international, federal, provincial, or state regulations, rules, laws, or local ordinances</span>
                  </li>
                  <li className="flex items-start">
                    <FaTimes className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Transmitting, or procuring the sending of, any advertising or promotional material without our prior written consent</span>
                  </li>
                  <li className="flex items-start">
                    <FaTimes className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Impersonating or attempting to impersonate the Company, a Company employee, another user, or any other person or entity</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">6. Intellectual Property</h2>
              <p className="text-primary-700 mb-4">
                All content, materials, and resources provided through our platform, including but not limited to videos, text, graphics, logos, images, and software, are the property of King Ezekiel Academy and are protected by copyright and other intellectual property laws.
              </p>
              <p className="text-primary-700">
                You may not reproduce, distribute, modify, or create derivative works from our content without express written permission.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">7. Limitation of Liability</h2>
              <p className="text-primary-700 mb-4">
                In no event shall King Ezekiel Academy, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">8. Termination</h2>
              <p className="text-primary-700 mb-4">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
              <p className="text-primary-700">
                If you wish to terminate your account, you may simply discontinue using the service or contact us to request account deletion.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">9. Governing Law</h2>
              <p className="text-primary-700">
                These Terms shall be interpreted and governed by the laws of Nigeria. Any dispute arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts in Nigeria.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">10. Contact Information</h2>
              <div className="space-y-3 text-primary-700">
                <div className="flex items-center">
                  <FaEnvelope className="h-5 w-5 text-primary-500 mr-3 flex-shrink-0" />
                  <span>Email: support@kingezekielacademy.com</span>
                </div>
                <div className="flex items-center">
                  <FaPhone className="h-5 w-5 text-primary-500 mr-3 flex-shrink-0" />
                  <span>Phone: +234 (0) 123 456 7890</span>
                </div>
                <div className="flex items-start">
                  <FaMapMarkerAlt className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Address: King Ezekiel Academy, Nigeria</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-primary-900 mb-4">Questions About These Terms?</h2>
              <p className="text-primary-700 mb-6">
                If you have any questions about these Terms of Service, please contact us using the information provided above.
              </p>
              <p className="text-sm text-primary-600">
                Last updated: January 1, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;