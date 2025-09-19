/**
 * Tests for Mini Browser Detection
 */

import { 
  isMiniBrowser, 
  getMiniBrowserType, 
  supportsModernReact, 
  getBrowserInfo,
  shouldUseClientOnlyRender,
  getRenderingStrategy 
} from '../miniBrowserDetection';

// Mock navigator for testing
const mockNavigator = (userAgent: string, vendor = '') => {
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent,
      vendor,
      language: 'en-US',
      platform: 'MacIntel',
      cookieEnabled: true,
      onLine: true
    },
    writable: true
  });
};

// Mock window for testing
const mockWindow = () => {
  Object.defineProperty(global, 'window', {
    value: {
      opera: '',
      localStorage: {},
      sessionStorage: {},
      indexedDB: {}
    },
    writable: true
  });
};

describe('Mini Browser Detection', () => {
  beforeEach(() => {
    mockWindow();
  });

  describe('isMiniBrowser', () => {
    it('should detect Instagram browser', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 155.0.0.37.107');
      expect(isMiniBrowser()).toBe(true);
    });

    it('should detect Facebook browser', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/329.0.0.37.95;]');
      expect(isMiniBrowser()).toBe(true);
    });

    it('should detect FBAN user agent', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/329.0.0.37.95;]');
      expect(isMiniBrowser()).toBe(true);
    });

    it('should detect WhatsApp browser', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.21.30.17');
      expect(isMiniBrowser()).toBe(true);
    });

    it('should not detect regular Chrome', () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      expect(isMiniBrowser()).toBe(false);
    });

    it('should not detect regular Safari', () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15');
      expect(isMiniBrowser()).toBe(false);
    });
  });

  describe('getMiniBrowserType', () => {
    it('should return "instagram" for Instagram browser', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 155.0.0.37.107');
      expect(getMiniBrowserType()).toBe('instagram');
    });

    it('should return "facebook" for Facebook browser', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/329.0.0.37.95;]');
      expect(getMiniBrowserType()).toBe('facebook');
    });

    it('should return null for regular browser', () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      expect(getMiniBrowserType()).toBe(null);
    });
  });

  describe('shouldUseClientOnlyRender', () => {
    it('should return true for mini browsers', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 155.0.0.37.107');
      expect(shouldUseClientOnlyRender()).toBe(true);
    });

    it('should return false for regular browsers', () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      expect(shouldUseClientOnlyRender()).toBe(false);
    });
  });

  describe('getRenderingStrategy', () => {
    it('should return "client-only" for mini browsers', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 155.0.0.37.107');
      expect(getRenderingStrategy()).toBe('client-only');
    });

    it('should return "modern-hydration" for regular browsers', () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      expect(getRenderingStrategy()).toBe('modern-hydration');
    });
  });
});
