// =====================================================
// ENVIRONMENT VALIDATION UTILITY
// Validates all required environment variables are set
// =====================================================

interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  summary: string;
}

export class EnvironmentValidator {
  // Required environment variables for client
  private static readonly REQUIRED_VARS = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY',
    'REACT_APP_API_URL'
  ];

  // Optional but recommended environment variables
  private static readonly RECOMMENDED_VARS = [
    'REACT_APP_GA_MEASUREMENT_ID',
    'REACT_APP_FACEBOOK_PIXEL_ID'
  ];

  // Variables that should NOT be in client-side code
  private static readonly FORBIDDEN_VARS = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'JWT_SECRET'
  ];

  /**
   * Validate all environment variables
   */
  static validate(): EnvValidationResult {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    for (const varName of this.REQUIRED_VARS) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    // Check recommended variables
    for (const varName of this.RECOMMENDED_VARS) {
      if (!process.env[varName]) {
        warnings.push(`${varName} is recommended but not set`);
      }
    }

    // Check for forbidden variables (security check)
    for (const varName of this.FORBIDDEN_VARS) {
      if (process.env[varName]) {
        warnings.push(`SECURITY WARNING: ${varName} should not be in client-side code`);
      }
    }

    // Validate specific values
    this.validateSupabaseConfig(warnings);
    this.validateApiConfig(warnings);

    const isValid = missing.length === 0;
    const summary = this.generateSummary(isValid, missing, warnings);

    return {
      isValid,
      missing,
      warnings,
      summary
    };
  }

  /**
   * Validate Supabase configuration
   */
  private static validateSupabaseConfig(warnings: string[]): void {
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (url && !url.startsWith('https://')) {
      warnings.push('REACT_APP_SUPABASE_URL should use HTTPS');
    }

    if (url && !url.includes('.supabase.co')) {
      warnings.push('REACT_APP_SUPABASE_URL does not appear to be a valid Supabase URL');
    }

    if (key && key.length < 100) {
      warnings.push('REACT_APP_SUPABASE_ANON_KEY appears to be too short');
    }
  }


  /**
   * Validate API configuration
   */
  private static validateApiConfig(warnings: string[]): void {
    const apiUrl = process.env.REACT_APP_API_URL;

    if (apiUrl && !apiUrl.startsWith('https://')) {
      warnings.push('REACT_APP_API_URL should use HTTPS in production');
    }

    if (apiUrl && apiUrl.includes('localhost')) {
      warnings.push('REACT_APP_API_URL points to localhost - ensure this is correct for your environment');
    }
  }

  /**
   * Generate validation summary
   */
  private static generateSummary(isValid: boolean, missing: string[], warnings: string[]): string {
    if (isValid && warnings.length === 0) {
      return '✅ All environment variables are properly configured';
    }

    if (isValid && warnings.length > 0) {
      return `⚠️ Environment is functional but has ${warnings.length} warning(s)`;
    }

    return `❌ Environment configuration is invalid - ${missing.length} required variable(s) missing`;
  }

  /**
   * Log validation results to console
   */
  static logValidation(): void {
    const result = this.validate();

    // console.log('🔧 Environment Validation Results:');
    // console.log(result.summary);

    if (result.missing.length > 0) {
      // console.log('\n❌ Missing required variables:');
      result.missing.forEach(varName => {
        // console.log(`  - ${varName}`);
      });
    }

    if (result.warnings.length > 0) {
      // console.log('\n⚠️ Warnings:');
      result.warnings.forEach(warning => {
        // console.log(`  - ${warning}`);
      });
    }

    if (result.isValid && result.warnings.length === 0) {
      // console.log('\n🎉 Environment is ready for production!');
    }
  }

  /**
   * Get environment status for debugging
   */
  static getEnvironmentStatus(): Record<string, any> {
    return {
      nodeEnv: process.env.NODE_ENV,
      required: this.REQUIRED_VARS.map(name => ({
        name,
        isSet: !!process.env[name],
        value: process.env[name] ? '***' : undefined
      })),
      recommended: this.RECOMMENDED_VARS.map(name => ({
        name,
        isSet: !!process.env[name],
        value: process.env[name] ? '***' : undefined
      })),
      forbidden: this.FORBIDDEN_VARS.map(name => ({
        name,
        isSet: !!process.env[name],
        value: process.env[name] ? '***' : undefined
      }))
    };
  }
}

// Auto-validate on import in development
if (process.env.NODE_ENV === 'development') {
  EnvironmentValidator.logValidation();
}
