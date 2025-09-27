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