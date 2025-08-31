/**
 * Lighthouse CI Configuration
 * 
 * This file configures Lighthouse CI for continuous SEO audits
 * and performance monitoring of the King Ezekiel Academy website.
 */

module.exports = {
  ci: {
    collect: {
      // Collect Lighthouse data
      url: [
        'https://thekingezekielacademy.com/',
        'https://thekingezekielacademy.com/courses',
        'https://thekingezekielacademy.com/blog',
        'https://thekingezekielacademy.com/about',
        'https://thekingezekielacademy.com/contact'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        },
        emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    },
    assert: {
      // Assertions for SEO and performance
      assertions: {
        // Performance assertions
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'metrics:first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'metrics:largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'metrics:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'metrics:total-blocking-time': ['error', { maxNumericValue: 300 }],
        'metrics:speed-index': ['error', { maxNumericValue: 3000 }],
        
        // SEO-specific assertions
        'audits:document-title': ['error', { minScore: 1 }],
        'audits:meta-description': ['error', { minScore: 1 }],
        'audits:link-text': ['error', { minScore: 0.9 }],
        'audits:image-alt': ['error', { minScore: 0.9 }],
        'audits:heading-elements': ['error', { minScore: 0.9 }],
        'audits:canonical': ['error', { minScore: 1 }],
        'audits:robots-txt': ['error', { minScore: 1 }],
        'audits:structured-data': ['error', { minScore: 0.8 }],
        
        // Performance assertions
        'audits:unused-css-rules': ['warn', { maxLength: 10 }],
        'audits:unused-javascript': ['warn', { maxLength: 10 }],
        'audits:modern-image-formats': ['warn', { minScore: 0.8 }],
        'audits:render-blocking-resources': ['warn', { maxLength: 5 }],
        'audits:unminified-css': ['warn', { maxLength: 5 }],
        'audits:unminified-javascript': ['warn', { maxLength: 5 }],
        
        // Accessibility assertions
        'audits:color-contrast': ['error', { minScore: 0.9 }],
        'audits:button-name': ['error', { minScore: 1 }],
        'audits:image-alt': ['error', { minScore: 0.9 }],
        'audits:label': ['error', { minScore: 0.9 }],
        'audits:list': ['error', { minScore: 0.9 }],
        'audits:listitem': ['error', { minScore: 0.9 }],
        'audits:tabindex': ['error', { minScore: 1 }],
        'audits:valid-lang': ['error', { minScore: 1 }],
        
        // Best practices assertions
        'audits:uses-https': ['error', { minScore: 1 }],
        'audits:external-anchors-use-rel-noopener': ['error', { minScore: 1 }],
        'audits:geolocation-on-start': ['error', { minScore: 1 }],
        'audits:no-document-write': ['error', { minScore: 1 }],
        'audits:js-libraries': ['warn', { maxLength: 10 }],
        'audits:notification-on-start': ['error', { minScore: 1 }],
        'audits:password-inputs-can-be-pasted-into': ['error', { minScore: 1 }],
        'audits:uses-http2': ['warn', { minScore: 0.8 }],
        'audits:uses-passive-event-listeners': ['warn', { minScore: 0.8 }]
      }
    },
    upload: {
      // Upload results to Lighthouse CI
      target: 'temporary-public-storage',
      token: process.env.LHCI_GITHUB_APP_TOKEN
    }
  }
};
