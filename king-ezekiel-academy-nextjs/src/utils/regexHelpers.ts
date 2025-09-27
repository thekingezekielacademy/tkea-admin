export const createSafariCompatibleRegex = (pattern: string, flags: string = '') => {
  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    // Fallback for Safari compatibility issues
    console.warn('Regex creation failed, using fallback:', error);
    return new RegExp(pattern.replace(/\\/g, '\\\\'), flags);
  }
};

export const safeRegexReplace = (str: string, regex: RegExp, replacement: string): string => {
  try {
    return str.replace(regex, replacement);
  } catch (error) {
    console.warn('Regex replace failed:', error);
    return str;
  }
};
