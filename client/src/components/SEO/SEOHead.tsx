import React from 'react';
import { Helmet } from 'react-helmet';

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
  ogImage = '/img/og-default.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
  noIndex = false,
  noFollow = false
}) => {
  const siteName = 'King Ezekiel Academy';
  const siteUrl = 'https://thekingezekielacademy.com';
  const fullTitle = `${title} | ${siteName}`;
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;

  // Robots meta tag
  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow'
  ].join(',');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      <meta name="twitter:site" content="@kingezekielacademy" />

      {/* Additional Meta Tags */}
      <meta name="author" content="King Ezekiel" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#1f2937" />
      
      {/* Facebook Domain Verification */}
      <meta name="facebook-domain-verification" content="c3qxn9yu9frspb8s9tceoh01uap0tr" />
      
      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
    </Helmet>
  );
};

export default SEOHead;
