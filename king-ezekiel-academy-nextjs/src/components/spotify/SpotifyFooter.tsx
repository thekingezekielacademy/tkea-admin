'use client';
import React from 'react';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTelegram, FaGraduationCap } from 'react-icons/fa';

const SpotifyFooter: React.FC = () => {
  const footerLinks = {
    company: [
      { name: 'About', path: '/about' },
      { name: 'Blog', path: '/blog' },
      { name: 'Contact', path: '/contact' },
    ],
    legal: [
      { name: 'Privacy', path: '/privacy' },
      { name: 'Terms', path: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: FaFacebook, href: 'https://facebook.com/thekingezekielacademy', label: 'Facebook' },
    { icon: FaInstagram, href: 'https://instagram.com/thekingezekielacademy', label: 'Instagram' },
    { icon: FaTelegram, href: 'https://t.me/thekingezekielacademy', label: 'Telegram' },
  ];

  return (
    <footer className="bg-secondary-900 border-t border-secondary-700 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <FaGraduationCap className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-white">
                TKEA
              </span>
            </Link>
            <p className="text-secondary-400 text-sm mb-4">
              Empowering students worldwide with quality education and digital skills training.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-secondary-800 hover:bg-secondary-700 rounded-full flex items-center justify-center text-secondary-400 hover:text-white transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-secondary-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-secondary-400 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
            <p className="text-secondary-400 text-sm mb-4">
              Get the latest courses and updates.
            </p>
            <Link
              href="/subscription"
              className="inline-block px-6 py-2 bg-white text-secondary-900 rounded-full text-sm font-semibold hover:bg-secondary-100 transition-colors"
            >
              Subscribe
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-400 text-sm mb-4 md:mb-0">
              © 2025 The King Ezekiel Academy LTD. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="text-secondary-400 hover:text-white text-sm transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SpotifyFooter;

