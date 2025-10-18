import React from 'react';
import Providers from '@/components/Providers';
import HydrationScript from '@/components/HydrationScript';
import './globals.css';

export const metadata = {
  title: 'King Ezekiel Academy',
  description: 'Digital Marketing Education Platform',
  keywords: 'digital marketing courses, online education, business growth, entrepreneurship, Nigeria, Africa, free courses, subscription',
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
    description: 'Transform your career with comprehensive digital marketing courses. Learn from industry experts and join 10,000+ successful students. Access FREE courses forever or upgrade for premium content!',
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
    description: 'Transform your career with comprehensive digital marketing courses. Learn from industry experts and join 10,000+ successful students. Access FREE courses forever or upgrade for premium content!',
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
        {/* Facebook Pixel - Optimized async loading with error handling */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Check if user is online before attempting to load
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                  console.debug('User is offline, skipping Facebook Pixel load');
                  return;
                }
                
                // Delay Facebook Pixel initialization to improve page load performance
                function loadFacebookPixel() {
                  try {
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;
                    // Add error handler for script loading
                    t.onerror=function(){console.debug('Facebook Pixel failed to load (might be blocked)')};
                    s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '1991898708291767');
                    fbq('track', 'PageView');
                  } catch (error) {
                    console.debug('Facebook Pixel initialization failed:', error.message);
                  }
                }
                
                if (typeof requestIdleCallback !== 'undefined') {
                  requestIdleCallback(loadFacebookPixel, { timeout: 2000 });
                } else {
                  setTimeout(loadFacebookPixel, 2000);
                }
              })();
            `,
          }}
        />
        <noscript>
          <img height="1" width="1" style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=1991898708291767&ev=PageView&noscript=1"
          />
        </noscript>
        
        {/* HubSpot Tracking Code - Optimized async loading */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Check if HubSpot Portal ID is configured
                var portalId = '${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''}';
                if (!portalId) {
                  console.debug('HubSpot Portal ID not configured');
                  return;
                }
                
                // Check if user is online before attempting to load
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                  console.debug('User is offline, skipping HubSpot load');
                  return;
                }
                
                // Initialize HubSpot tracking queue
                window._hsq = window._hsq || [];
                
                // Delay HubSpot script loading to improve page load performance
                function loadHubSpot() {
                  try {
                    var script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.id = 'hs-script-loader';
                    script.async = true;
                    script.defer = true;
                    script.src = '//js.hs-scripts.com/' + portalId + '.js';
                    script.onerror = function() {
                      console.debug('HubSpot script failed to load');
                    };
                    document.body.appendChild(script);
                  } catch (error) {
                    console.debug('HubSpot initialization failed:', error.message);
                  }
                }
                
                if (typeof requestIdleCallback !== 'undefined') {
                  requestIdleCallback(loadHubSpot, { timeout: 3000 });
                } else {
                  setTimeout(loadHubSpot, 3000);
                }
              })();
            `,
          }}
        />
        
        {/* Optimized font loading - only preconnect, no preload */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Remove font preload to prevent unused resource warnings */}
        
        {/* Hydration script to clean extension attributes */}
        <HydrationScript />
      </head>
    <body suppressHydrationWarning={true}>
      <Providers>
        {children}
      </Providers>
    </body>
    </html>
  );
}