/**
 * Safari-compatible regex utilities
 * Provides helper functions for regex operations that work across all browsers
 */

/**
 * Executes a regex with named groups simulation for Safari compatibility
 * @param regex - The regex pattern to execute
 * @param str - The string to match against
 * @param groupMap - Object mapping group names to their index positions
 * @returns Object with named group values or null if no match
 * 
 * @example
 * const regex = /(\w+)\s+(\d+)/;
 * const groups = execNamedGroups(regex, "Ezekiel 25", { name: 1, age: 2 });
 * console.log(groups?.name); // "Ezekiel"
 * console.log(groups?.age); // "25"
 */
export function execNamedGroups(
  regex: RegExp,
  str: string,
  groupMap: Record<string, number>
): Record<string, string> | null {
  const match = regex.exec(str);
  if (!match) return null;
  
  const result: Record<string, string> = {};
  Object.keys(groupMap).forEach((key) => {
    const index = groupMap[key];
    result[key] = match[index] || '';
  });
  
  return result;
}

/**
 * Creates a Safari-compatible regex pattern by converting named groups to regular groups
 * @param pattern - The regex pattern string
 * @param flags - Optional regex flags
 * @returns RegExp object that works in Safari
 * 
 * @example
 * const regex = createSafariCompatibleRegex('(?<username>\\w+)', 'g');
 * // This will be converted to (\\w+) internally
 */
export function createSafariCompatibleRegex(pattern: string, flags?: string): RegExp {
  // Remove named capture groups for Safari compatibility
  const safariPattern = pattern.replace(/\(\?\<[^>]+\>/g, '(');
  
  try {
    return new RegExp(safariPattern, flags);
  } catch (error) {
    console.error('Invalid regex pattern:', pattern, error);
    // Return a safe regex that matches nothing - Safari-compatible
    return /^$/
  }
}

/**
 * Validates if a regex pattern contains named capture groups
 * @param pattern - The regex pattern string
 * @returns true if pattern contains named groups
 */
export function hasNamedGroups(pattern: string): boolean {
  return /\(\?\<[^>]+\>/.test(pattern);
}

/**
 * Converts a regex with named groups to use regular groups
 * @param pattern - The regex pattern string
 * @returns Object with converted pattern and group mapping
 */
export function convertNamedGroups(pattern: string): {
  pattern: string;
  groupMap: Record<string, number>;
} {
  const groupMap: Record<string, number> = {};
  let groupIndex = 1;
  
  const convertedPattern = pattern.replace(/\(\?\<([^>]+)\>/g, (match, groupName) => {
    groupMap[groupName] = groupIndex++;
    return '(';
  });
  
  return { pattern: convertedPattern, groupMap };
}
