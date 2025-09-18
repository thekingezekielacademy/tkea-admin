/** @type {import('next').NextConfig} */
const nextConfig = {
  // Target Safari 12+ and iOS in-app browsers
  target: 'serverless',
  
  // Enable experimental features for legacy browser support
  experimental: {
    legacyBrowsers: true,
    browsersListForSwc: true
  },

  // Babel configuration for Safari 12+ compatibility
  babel: {
    presets: [
      [
        'next/babel',
        {
          'preset-env': {
            targets: {
              safari: '12',
              ios_saf: '12',
              chrome: '60',
              firefox: '60',
              edge: '79'
            },
            useBuiltIns: 'entry',
            corejs: 3,
            modules: false
          }
        }
      ]
    ],
    plugins: [
      // Polyfills for ES2020+ features
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-proposal-logical-assignment-operators',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
      
      // Regex named groups support
      '@babel/plugin-proposal-named-capturing-groups-regex',
      
      // Object rest/spread for Safari 12
      '@babel/plugin-proposal-object-rest-spread',
      
      // Class properties
      '@babel/plugin-proposal-class-properties',
      
      // Private methods
      '@babel/plugin-proposal-private-methods',
      '@babel/plugin-proposal-private-property-in-object',
      
      // Dynamic imports
      '@babel/plugin-syntax-dynamic-import',
      
      // Decorators
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      
      // Transform runtime for polyfills
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: 3,
          helpers: true,
          regenerator: true,
          useESModules: false
        }
      ]
    ]
  },

  // SWC configuration - disable minifier for Safari compatibility
  swcMinify: false,
  
  // Webpack configuration for additional Safari support
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

    // Ensure proper transpilation for Safari 12
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                targets: {
                  safari: '12',
                  ios_saf: '12',
                  chrome: '60',
                  firefox: '60',
                  edge: '79'
                },
                useBuiltIns: 'entry',
                corejs: 3,
                modules: false
              }
            ],
            '@babel/preset-react',
            '@babel/preset-typescript'
          ],
          plugins: [
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-proposal-nullish-coalescing-operator',
            '@babel/plugin-proposal-named-capturing-groups-regex',
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-private-methods',
            '@babel/plugin-proposal-private-property-in-object',
            '@babel/plugin-syntax-dynamic-import',
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            [
              '@babel/plugin-transform-runtime',
              {
                corejs: 3,
                helpers: true,
                regenerator: true,
                useESModules: false
              }
            ]
          ]
        }
      }
    });

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

  // Compiler options for Safari compatibility
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output configuration
  output: 'standalone',
  
  // Disable static optimization for better Safari compatibility
  trailingSlash: false,
  
  // Enable source maps for debugging
  productionBrowserSourceMaps: true
}

module.exports = nextConfig
