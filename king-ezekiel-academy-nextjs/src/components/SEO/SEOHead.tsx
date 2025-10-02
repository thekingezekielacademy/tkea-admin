'use client';
import React, { useEffect, useState } from 'react';
import { HydrationSafeValue } from '@/components/HydrationSafeValue';

export interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'course' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  structuredData?: object;
  noIndex?: boolean;
  noFollow?: boolean;
}

/**
 * SEOHead Component - Comprehensive SEO management for all pages
 * 
 * Features:
 * - Dynamic meta tags and titles
 * - Open Graph and Twitter Card support
 * - Structured data (JSON-LD) integration
 * - Robots meta control
 * - Canonical URLs
 * - Keyword optimization
 */
const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogImage = '/img/link-previewer-optimized.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
  noIndex = false,
  noFollow = false
}) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const siteName = 'King Ezekiel Academy';
  const siteUrl = 'https://thekingezekielacademy.com';
  const fullTitle = `${title} | ${siteName}`;
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;

  // Robots meta tag
  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow'
  ].join(',');

  useEffect(() => {
    // Mark as hydrated to prevent hydration mismatches
    setIsHydrated(true);
    // Update document title
    document.title = fullTitle;

    // Function to update or create meta tag
    const updateMetaTag = (selector: string, content: string, attribute: string = 'content') => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        const parts = selector.replace(/\[|]/g, '').split('=');
        element.setAttribute(parts[0], parts[1].replace(/"/g, ''));
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Function to update or create link tag
    const updateLinkTag = (selector: string, href: string) => {
      let element = document.querySelector(selector) as HTMLLinkElement;
      if (!element) {
        element = document.createElement('link');
        const parts = selector.replace(/\[|]/g, '').split('=');
        element.setAttribute(parts[0], parts[1].replace(/"/g, ''));
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Basic Meta Tags
    updateMetaTag('meta[name="description"]', description);
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', keywords);
    }
    updateMetaTag('meta[name="robots"]', robotsContent);
    updateLinkTag('link[rel="canonical"]', fullCanonical);

    // Open Graph Meta Tags
    updateMetaTag('meta[property="og:title"]', fullTitle);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:type"]', ogType);
    updateMetaTag('meta[property="og:url"]', fullCanonical);
    updateMetaTag('meta[property="og:image"]', `${siteUrl}${ogImage}`);
    updateMetaTag('meta[property="og:site_name"]', siteName);
    updateMetaTag('meta[property="og:locale"]', 'en_US');

    // Twitter Card Meta Tags
    updateMetaTag('meta[name="twitter:card"]', twitterCard);
    updateMetaTag('meta[name="twitter:title"]', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', description);
    updateMetaTag('meta[name="twitter:image"]', `${siteUrl}${ogImage}`);
    updateMetaTag('meta[name="twitter:site"]', '@kingezekielacademy');

    // Additional Meta Tags
    updateMetaTag('meta[name="author"]', 'King Ezekiel');
    updateMetaTag('meta[name="theme-color"]', '#1f2937');
    updateMetaTag('meta[name="facebook-domain-verification"]', 'c3qxn9yu9frspb8s9tceoh01uap0tr');

    // Structured Data (JSON-LD)
    if (structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(structuredData);
    }

    // Preconnect links (only add if not already present)
    const preconnectUrls = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com'
    ];

    preconnectUrls.forEach(url => {
      if (!document.querySelector(`link[rel="preconnect"][href="${url}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        if (url === 'https://fonts.gstatic.com') {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      }
    });

  }, [fullTitle, description, keywords, robotsContent, fullCanonical, ogType, siteUrl, ogImage, siteName, twitterCard, structuredData]);

  // Only render after hydration to prevent mismatches
  if (!isHydrated) {
    return null;
  }

  return null;
};

export default SEOHead;