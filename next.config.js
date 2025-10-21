/** @type {import('next').NextConfig} */
const nextConfig = {
  // Modern Next.js configuration for Safari 12+ and iOS in-app browsers
  
  // SWC minification enabled (faster and more reliable than Terser)
  swcMinify: true,
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Add polyfills for Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false
      };
    }

    // Optimize chunk loading
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    };

    return config;
  },

  // Headers for security and Instagram/Facebook compatibility
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.facebook.com https://*.instagram.com;"
          }
        ]
      }
    ]
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output configuration
  output: 'standalone',
  
  // Trailing slash configuration
  trailingSlash: false,
  
  // Enable source maps for debugging (disable in production for better performance)
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    domains: ['thekingezekielacademy.com'],
    formats: ['image/webp', 'image/avif']
  }
}

module.exports = nextConfig
