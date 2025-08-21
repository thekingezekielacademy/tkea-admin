import React from 'react';
import { FaFileContract, FaCheck, FaTimes, FaGraduationCap, FaCreditCard, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Terms: React.FC = () => {
  return (
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
            Effective Date: January 1, 2024
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
                  <span>Certifications and progress tracking</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">3. User Accounts</h2>
            <div className="space-y-4 text-primary-700">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaCheck className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>You must provide accurate and complete information when creating an account</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>You are responsible for maintaining the confidentiality of your login credentials</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>You are responsible for all activities that occur under your account</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">4. Payments and Subscriptions</h2>
            <div className="space-y-4 text-primary-700">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaCreditCard className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Some services require payment. By subscribing or purchasing, you agree to provide accurate billing details</span>
                </li>
                <li className="flex items-start">
                  <FaCreditCard className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Payments are processed via trusted third-party providers (Paystack)</span>
                </li>
                <li className="flex items-start">
                  <FaCreditCard className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Subscriptions may automatically renew unless canceled before the renewal date</span>
                </li>
                <li className="flex items-start">
                  <FaCreditCard className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Refunds are subject to our Refund Policy</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">5. Free Trials</h2>
            <div className="space-y-4 text-primary-700">
              <p>We offer free trials for certain services:</p>
              <ul className="space-y-2">
                <li>• 7-day free trial for new subscribers</li>
                <li>• At the end of the free trial, you will be automatically billed unless you cancel before the trial ends</li>
                <li>• No commitment required during the trial period</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">6. User Conduct</h2>
            <p className="text-primary-700 mb-4">
              By using our services, you agree NOT to:
            </p>
            <ul className="space-y-3 text-primary-700">
              <li className="flex items-start">
                <FaTimes className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Share course materials publicly without permission</span>
              </li>
              <li className="flex items-start">
                <FaTimes className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Misuse the platform for illegal, fraudulent, or harmful activities</span>
              </li>
              <li className="flex items-start">
                <FaTimes className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Infringe upon the intellectual property rights of THE KING EZEKIEL ACADEMY or others</span>
              </li>
              <li className="flex items-start">
                <FaTimes className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Attempt to gain unauthorized access to our systems or other users' accounts</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">7. Intellectual Property</h2>
            <div className="space-y-4 text-primary-700">
              <ul className="space-y-3">
                <li>• All course materials, videos, texts, and digital content remain the property of THE KING EZEKIEL ACADEMY</li>
                <li>• You are granted a limited, non-transferable license for personal use only</li>
                <li>• You may not copy, resell, or redistribute our content without permission</li>
                <li>• Unauthorized use may result in legal action</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">8. Termination</h2>
            <div className="space-y-4 text-primary-700">
              <p>We reserve the right to suspend or terminate your account if you violate these Terms. Upon termination:</p>
              <ul className="space-y-2">
                <li>• You lose access to our services and content</li>
                <li>• Any remaining subscription time is forfeited</li>
                <li>• You remain responsible for any outstanding payments</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">9. Limitation of Liability</h2>
            <div className="space-y-4 text-primary-700">
              <ul className="space-y-3">
                <li>• We provide educational services "as is" without warranties of any kind</li>
                <li>• THE KING EZEKIEL ACADEMY is not liable for any direct, indirect, or consequential damages</li>
                <li>• We are not responsible for the success or failure of your career or business endeavors</li>
                <li>• Our liability is limited to the amount you paid for our services</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">10. Privacy</h2>
            <p className="text-primary-700">
              Your use of our services is also governed by our Privacy Policy. Please review it to understand how we collect, use, and protect your information.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">11. Changes to Terms</h2>
            <div className="space-y-4 text-primary-700">
              <p>We may update these Terms at any time:</p>
              <ul className="space-y-2">
                <li>• Changes will be posted on our website</li>
                <li>• Continued use of our services means you accept the updated Terms</li>
                <li>• We will notify users of significant changes via email</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-primary-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">12. Governing Law</h2>
            <p className="text-primary-700">
              These Terms are governed by the laws of Nigeria. Any disputes will be resolved under the jurisdiction of the courts in Lagos, Nigeria.
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">13. Contact Us</h2>
            <p className="text-primary-700 mb-6">
              If you have questions about these Terms, please contact us at:
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

export default Terms;
