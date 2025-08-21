import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Logo from './Logo';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-gradient-to-br from-primary-50 to-secondary-50 text-primary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <Logo size="2xl" />
            </div>
            <p className="text-primary-600 mb-8 max-w-md leading-relaxed">
              Empowering students worldwide with quality education and digital skills training. 
              Join our community of learners and transform your career today.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-200 hover:text-primary-700 transition-all duration-200">
                <FaFacebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-200 hover:text-primary-700 transition-all duration-200">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-200 hover:text-primary-700 transition-all duration-200">
                <FaInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-200 hover:text-primary-700 transition-all duration-200">
                <FaLinkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" onClick={scrollToTop} className="text-primary-600 hover:text-primary-700 transition-colors duration-200 flex items-center">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" onClick={scrollToTop} className="text-primary-600 hover:text-primary-700 transition-colors duration-200 flex items-center">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={scrollToTop} className="text-primary-600 hover:text-primary-700 transition-colors duration-200 flex items-center">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={scrollToTop} className="text-primary-600 hover:text-primary-700 transition-colors duration-200 flex items-center">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-6">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <FaMapMarkerAlt className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-primary-600 text-sm leading-relaxed">123 Education St, Learning City</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <FaPhone className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-primary-600 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <FaEnvelope className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-primary-600 text-sm">info@kingezekielacademy.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-600 text-sm">
              © 2025 King Ezekiel Academy. All rights reserved.
            </p>
            <div className="flex space-x-8 mt-4 md:mt-0">
              <Link to="/privacy" onClick={scrollToTop} className="text-primary-600 hover:text-primary-700 text-sm transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" onClick={scrollToTop} className="text-primary-600 hover:text-primary-700 text-sm transition-colors duration-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
