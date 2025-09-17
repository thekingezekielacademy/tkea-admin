/**
 * Safari Compatibility Utilities
 * Provides fallbacks and compatibility checks for Safari browsers
 */

/**
 * Detects if the current browser is Safari
 */
export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Chromium/.test(userAgent);
}

/**
 * Detects if the current browser is an older Safari version that doesn't support advanced regex
 */
export function isOldSafari(): boolean {
  if (!isSafari()) return false;
  
  const userAgent = window.navigator.userAgent;
  const versionMatch = userAgent.match(/Version\/(\d+)/);
  
  if (!versionMatch) return true; // Assume old if we can't detect version
  
  const version = parseInt(versionMatch[1], 10);
  return version < 16; // Safari 16+ supports more advanced regex features
}

/**
 * Creates a Safari-compatible regex by replacing unsupported features
 */
export function createSafariCompatibleRegex(pattern: string, flags?: string): RegExp {
  if (!isOldSafari()) {
    // Modern Safari supports advanced regex, use as-is
    try {
      return new RegExp(pattern, flags);
    } catch (error) {
      console.warn('Regex creation failed, using fallback:', error);
    }
  }
  
  // For old Safari, replace unsupported features
  let safariPattern = pattern;
  
  // Replace lookahead assertions (?=...) with capturing groups
  safariPattern = safariPattern.replace(/\(\?\=([^)]+)\)/g, '($1)');
  
  // Replace negative lookahead (?!...) with string-based checks
  safariPattern = safariPattern.replace(/\(\?\!([^)]+)\)/g, '');
  
  // Replace lookbehind assertions (?<=...) with capturing groups
  safariPattern = safariPattern.replace(/\(\?\<\=([^)]+)\)/g, '($1)');
  
  // Replace negative lookbehind (?<!...) with string-based checks
  safariPattern = safariPattern.replace(/\(\?\<\!([^)]+)\)/g, '');
  
  // Replace named capture groups (?<name>...) with regular groups
  safariPattern = safariPattern.replace(/\(\?\<[^>]+\>/g, '(');
  
  try {
    return new RegExp(safariPattern, flags);
  } catch (error) {
    console.error('Safari-compatible regex creation failed:', error);
    // Return a safe regex that matches nothing
    return /^$/;
  }
}

/**
 * Safely executes a regex with fallback for Safari compatibility
 */
export function safeRegexExec(regex: RegExp, str: string): RegExpExecArray | null {
  try {
    return regex.exec(str);
  } catch (error) {
    console.warn('Regex execution failed, using fallback:', error);
    return null;
  }
}

/**
 * Safely tests a regex with fallback for Safari compatibility
 */
export function safeRegexTest(regex: RegExp, str: string): boolean {
  try {
    return regex.test(str);
  } catch (error) {
    console.warn('Regex test failed, using fallback:', error);
    return false;
  }
}

/**
 * Safely replaces text using regex with fallback for Safari compatibility
 */
export function safeRegexReplace(
  str: string, 
  regex: RegExp, 
  replacement: string
): string;
export function safeRegexReplace(
  str: string, 
  regex: RegExp, 
  replacement: (substring: string, ...args: any[]) => string
): string;
export function safeRegexReplace(
  str: string, 
  regex: RegExp, 
  replacement: string | ((substring: string, ...args: any[]) => string)
): string {
  try {
    return str.replace(regex, replacement as any);
  } catch (error) {
    console.warn('Regex replace failed, using fallback:', error);
    return str;
  }
}

/**
 * String-based alternatives for common regex patterns that cause Safari issues
 */
export const StringAlternatives = {
  /**
   * Check if string starts with a pattern (alternative to ^pattern)
   */
  startsWith: (str: string, pattern: string): boolean => {
    return str.startsWith(pattern);
  },
  
  /**
   * Check if string ends with a pattern (alternative to pattern$)
   */
  endsWith: (str: string, pattern: string): boolean => {
    return str.endsWith(pattern);
  },
  
  /**
   * Check if string contains a pattern (alternative to /pattern/)
   */
  includes: (str: string, pattern: string): boolean => {
    return str.includes(pattern);
  },
  
  /**
   * Split string by pattern (alternative to str.split(/pattern/))
   */
  split: (str: string, pattern: string): string[] => {
    return str.split(pattern);
  },
  
  /**
   * Find all occurrences of a pattern in a string
   */
  findAll: (str: string, pattern: string): string[] => {
    const results: string[] = [];
    let index = 0;
    while (index < str.length) {
      const found = str.indexOf(pattern, index);
      if (found === -1) break;
      results.push(str.substring(found, found + pattern.length));
      index = found + 1;
    }
    return results;
  }
};

/**
 * Feature detection for advanced regex support
 */
export function supportsAdvancedRegex(): boolean {
  try {
    // Test lookahead assertion
    new RegExp('(?=test)');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Feature detection for named capture groups
 */
export function supportsNamedGroups(): boolean {
  try {
    // Test named capture group
    new RegExp('(?<name>test)');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Feature detection for lookbehind assertions
 */
export function supportsLookbehind(): boolean {
  try {
    // Test lookbehind assertion
    new RegExp('(?<=test)');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get browser capabilities for debugging
 */
export function getBrowserCapabilities() {
  return {
    isSafari: isSafari(),
    isOldSafari: isOldSafari(),
    supportsAdvancedRegex: supportsAdvancedRegex(),
    supportsNamedGroups: supportsNamedGroups(),
    supportsLookbehind: supportsLookbehind(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
  };
}
