import React from 'react';
import Providers from '@/components/Providers';
import HydrationScript from '@/components/HydrationScript';
import './globals.css';

export const metadata = {
  title: 'King Ezekiel Academy',
  description: 'Digital Marketing Education Platform',
  keywords: 'digital marketing courses, online education, business growth, entrepreneurship, Nigeria, Africa, free trial, subscription',
  authors: [{ name: 'King Ezekiel' }],
  creator: 'King Ezekiel Academy',
  publisher: 'King Ezekiel Academy',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://thekingezekielacademy.com',
    siteName: 'King Ezekiel Academy',
    title: 'King Ezekiel Academy - Digital Marketing Education Platform',
    description: 'Transform your career with comprehensive digital marketing courses. Learn from industry experts and join 10,000+ successful students. Start your 7-day FREE trial today!',
    images: [
      {
        url: 'https://thekingezekielacademy.com/img/link-previewer-optimized.jpg',
        width: 1200,
        height: 630,
        alt: 'King Ezekiel Academy - Digital Marketing Education Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@kingezekielacademy',
    creator: '@kingezekielacademy',
    title: 'King Ezekiel Academy - Digital Marketing Education Platform',
    description: 'Transform your career with comprehensive digital marketing courses. Learn from industry experts and join 10,000+ successful students. Start your 7-day FREE trial today!',
    images: ['https://thekingezekielacademy.com/img/link-previewer-optimized.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'King Ezekiel Academy'
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e3a8a'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Facebook Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1991898708291767');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img height="1" width="1" style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=1991898708291767&ev=PageView&noscript=1"
          />
        </noscript>
        
        {/* Optimized font loading - only preconnect, no preload */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Remove font preload to prevent unused resource warnings */}
        
        {/* Hydration script to clean extension attributes */}
        <HydrationScript />
      </head>
    <body suppressHydrationWarning={true}>
      <div suppressHydrationWarning={true}>
        <Providers>
          {children}
        </Providers>
        {/* Script to clean extension attributes immediately */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Clean extension attributes immediately to prevent hydration mismatches
                const extensionAttributes = [
                  'bis_skin_checked',
                  'data-bis_skin_checked', 
                  'data-bis_skin_checked_original',
                  'data-bis_skin_checked_modified'
                ];
                
                function cleanAttributes() {
                  const elements = document.querySelectorAll('*');
                  elements.forEach(element => {
                    extensionAttributes.forEach(attr => {
                      if (element.hasAttribute(attr)) {
                        element.removeAttribute(attr);
                      }
                    });
                  });
                }
                
                // Clean immediately
                cleanAttributes();
                
                // Clean on DOM ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', cleanAttributes, { once: true });
                }
                
                // Clean periodically to catch dynamically added attributes
                setTimeout(cleanAttributes, 0);
                setTimeout(cleanAttributes, 100);
                setTimeout(cleanAttributes, 500);
              })();
            `,
          }}
        />
      </div>
    </body>
    </html>
  );
}