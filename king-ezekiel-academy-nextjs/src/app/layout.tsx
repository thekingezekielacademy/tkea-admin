import React from 'react';
import Providers from '@/components/Providers';
import HydrationFix from '@/components/HydrationFix';
import HydrationScript from '@/components/HydrationScript';
import './globals.css';

export const metadata = {
  title: 'King Ezekiel Academy',
  description: 'Digital Marketing Education Platform',
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
        <HydrationScript />
      </head>
      <body suppressHydrationWarning={true}>
        <HydrationFix />
        <div suppressHydrationWarning={true}>
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}