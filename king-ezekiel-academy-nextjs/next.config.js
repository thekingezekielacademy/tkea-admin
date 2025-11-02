const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
  buildExcludes: [/middleware-manifest\.json$/],
  exclude: [
    /^\/api\/.*$/,
    /^\/_next\/.*$/,
    /^\/static\/.*$/,
    /webpack.*\.hot-update\.js$/, // Exclude hot update files
  ],
  runtimeCaching: [
    // CRITICAL: OAuth callback URLs - never cache or intercept
    // This prevents service worker from breaking Google OAuth and other auth flows
    // Must be FIRST to prevent / route from intercepting
    {
      urlPattern: /[&?](code|error|state)=/,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'auth-callbacks',
      }
    },
    {
      urlPattern: /\/auth\/callback/,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'auth-callbacks',
      }
    },
    // API requests - never cache
    {
      urlPattern: /^\/api\/.*$/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'api-cache',
      }
    },
    // Supabase requests - never cache
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'supabase-cache',
      }
    },
    // Fonts - cache aggressively
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    // Static assets - moderate caching
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    },
    // Next.js assets - moderate caching
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Hydration fixes
  reactStrictMode: false, // Disable strict mode to prevent hydration issues
  experimental: {
    // Critical performance optimizations
    optimizeCss: true,
    scrollRestoration: true,
    // Enable modern bundling
    esmExternals: true,
    // Optimize Fast Refresh
    optimizePackageImports: ['react-icons'],
    // Reduce bundle size - moved to serverExternalPackages
    // Reduce preload warnings
    optimizeServerReact: true,
    // Optimize font loading - removed deprecated fontLoaders
  },
  // Server external packages for optimal performance
  serverExternalPackages: ['@supabase/supabase-js'],
  // Critical performance settings
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Optimize development experience
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  images: {
    domains: [
      'img.youtube.com',
      'i.ytimg.com',
      'supabase.co',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  // Removed problematic redirects that were causing infinite loops
  
  // Allow cross-origin requests in development
  allowedDevOrigins: ['192.168.178.200'],
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    // Reduce bundle size by excluding unnecessary modules
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optimize moment.js if used
      'moment': 'moment/min/moment.min.js',
    };

    return config;
  },
}

module.exports = withPWA(nextConfig)
